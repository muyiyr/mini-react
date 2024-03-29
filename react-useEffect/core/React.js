const createElement = (type, props, ...children) => {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                const isTextNode =
                    typeof child === "string" || typeof child === "number";
                return isTextNode ? createTextNode(child) : child;
            }),
        },
    };
};

const createTextNode = (text) => {
    return {
        type: "text_node",
        props: {
            nodeValue: text,
            children: [],
        },
    };
};

const render = (el, container) => {
    wipRoot = {
        dom: container,
        props: {
            children: [el],
        },
    };

    nextUnitOfWork = wipRoot;
};

// work in progress
let wipRoot = null;
let currentRoot = null;
let nextUnitOfWork = null;
let deletions = [];
let wipFiber = null;
function workLoop(deadline) {
    let shouldYield = false;
    while (!shouldYield && nextUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

        if (wipRoot?.sibling?.type === nextUnitOfWork?.type) {
            console.log("hit", wipRoot, nextUnitOfWork);
            nextUnitOfWork = undefined;
        }

        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop);
}

function commitRoot() {
    deletions.forEach(commitDeletion);
    deletions = [];
    commitEffectHooks();
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

function commitEffectHooks() {
    function executeEffect(fiber) {
        if (!fiber) return;
        if (!fiber.alternate) {
            fiber.effectHooks?.forEach((effectHook) => {
                effectHook.cleanUp = effectHook.callback();
            });
        } else {
            // update
            fiber.effectHooks?.forEach((newHook, index) => {
                if (!(newHook.dependencies.length > 0)) return;
                const oldEffectHook = fiber.alternate?.effectHooks[index];
                const needUpdate = oldEffectHook?.dependencies.some((oldDep, oldIndex) => {
                    return oldDep !== newHook.dependencies[oldIndex];
                });

                needUpdate && (newHook.cleanUp = newHook?.callback());
            });
        }
        executeEffect(fiber.child);
        executeEffect(fiber.sibling);
    }
    function executeCleanUp(fiber) {
        if (!fiber) return

        fiber.alternate?.effectHooks?.forEach((hook) => {
            if (!(hook.dependencies.length > 0)) return;
            hook?.cleanUp?.();
        })
        executeCleanUp(fiber.child)
        executeCleanUp(fiber.sibling)
    }
    executeCleanUp(wipRoot)
    executeEffect(wipRoot);
}
function commitDeletion(fiber) {
    if (fiber.dom) {
        let fiberParent = fiber.parent;
        while (!fiberParent.dom) fiberParent = fiberParent.parent;
        fiberParent.dom.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child);
    }
}

function commitWork(fiber) {
    if (!fiber) return;
    let fiberParent = fiber.parent;
    while (!fiberParent.dom) fiberParent = fiberParent.parent;

    if (fiber.effectTag === "update") {
        updateProps(fiber.dom, fiber.props, fiber.alternate.props);
    } else if (fiber.effectTag === "placement") {
        if (fiber.dom) fiberParent.dom.append(fiber.dom);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function createDom(type) {
    return type === "text_node"
        ? document.createTextNode("")
        : document.createElement(type);
}

function updateProps(dom, nextProps, preProps = {}) {
    // Object.keys(nextProps).forEach((key) => {
    //   if (key !== "children") {
    //     if (key.startsWith("on")) {
    //       const eventType = key.slice(2).toLocaleLowerCase();
    //       dom.addEventListener(eventType, nextProps[key]);
    //     } else {
    //       dom[key] = nextProps[key];
    //     }
    //   }
    // });

    // 1. old 有 new 没有 删除
    Object.keys(preProps).forEach((key) => {
        if (key !== "children") {
            if (!(key in nextProps)) {
                dom.removeAttribute(key);
            }
        }
    });

    //
    // 2. new 有 old 没有 添加
    // 3. new 有 old 有 更新
    Object.keys(nextProps).forEach((key) => {
        if (key !== "children") {
            if (preProps[key] !== nextProps[key]) {
                if (key.startsWith("on")) {
                    const eventType = key.slice(2).toLocaleLowerCase();
                    dom.removeEventListener(eventType, preProps[key]);
                    dom.addEventListener(eventType, nextProps[key]);
                } else {
                    dom[key] = nextProps[key];
                }
            }
        }
    });
}

function reconcileChild(fiber, children) {
    let oldFiber = fiber.alternate?.child;

    let prevChild = null;
    children.forEach((child, index) => {
        const isSameType = oldFiber && oldFiber.type === child.type;
        let newFiber;
        if (isSameType) {
            newFiber = {
                type: child.type,
                props: child.props,
                dom: oldFiber.dom,
                child: null,
                parent: fiber,
                sibling: null,
                alternate: oldFiber,
                effectTag: "update",
            };
        } else {
            if (child) {
                newFiber = {
                    type: child.type,
                    props: child.props,
                    dom: null,
                    child: null,
                    parent: fiber,
                    sibling: null,
                    effectTag: "placement",
                };
            }

            if (oldFiber) {
                deletions.push(oldFiber);
            }
        }

        if (oldFiber) oldFiber = oldFiber.sibling;

        if (index === 0) {
            fiber.child = newFiber;
        } else {
            prevChild.sibling = newFiber;
        }
        if (newFiber) {
            prevChild = newFiber;
        }
    });

    while (oldFiber) {
        deletions.push(oldFiber);
        oldFiber = oldFiber.sibling;
    }
}

function updateFunctionComponent(fiber) {
    stateHooks = [];
    stateHookIndex = 0;
    wipFiber = fiber;
    const children = [fiber.type(fiber.props)];
    reconcileChild(fiber, children);
}

function updateHostFunction(fiber) {
    if (!fiber.dom) {
        const dom = (fiber.dom = createDom(fiber.type));
        updateProps(dom, fiber.props);
    }

    const children = fiber.props.children;
    reconcileChild(fiber, children);
}

function performUnitOfWork(fiber) {
    const isFunctionComponent = typeof fiber.type === "function";

    isFunctionComponent
        ? updateFunctionComponent(fiber)
        : updateHostFunction(fiber);

    if (fiber.child) return fiber.child;

    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent;
    }
}

requestIdleCallback(workLoop);

function update() {
    let currentFiber = wipFiber;
    console.log(`( React.js: currentFiber )===============>`, currentFiber);

    return () => {
        wipRoot = {
            ...currentFiber,
            alternate: currentFiber,
        };
        nextUnitOfWork = wipRoot;
    };
}
let stateHooks = [];
let stateHookIndex = 0;
function useState(initial) {
    let currentFiber = wipFiber;
    const oldHook = currentFiber.alternate?.stateHooks[stateHookIndex];
    const stateHook = {
        state: oldHook ? oldHook.state : initial,
        queue: oldHook ? oldHook.queue : [],
    };

    stateHook.queue.forEach((action) => {
        stateHook.state = action(stateHook.state);
    });
    stateHook.queue = [];

    stateHooks.push(stateHook);
    stateHookIndex++;
    currentFiber.stateHooks = stateHooks;

    function setState(action) {
        const eagerState = typeof action === "function" ? action() : action;
        if (eagerState === stateHook.state) return;
        stateHook.queue.push(typeof action === "function" ? action : () => action);
        wipRoot = {
            ...currentFiber,
            alternate: currentFiber,
        };
        nextUnitOfWork = wipRoot;
    }
    return [stateHook.state, setState];
}

function useEffect(callback, dependencies) {
    const effectHook = {
        callback,
        dependencies,
        cleanUp: undefined,
    };
    effectHooks.push(effectHook);
    wipFiber.effectHooks = effectHooks;
}
export default { createElement, useState, render, update };