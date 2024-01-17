function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                const isTextNode = typeof child === "string" || typeof child === "number";
                return isTextNode ? createTextElement(child) : child;
            }),
        },
    };
}

function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            textContent: text,
            children: [],
        },
    };
}

function render(vdom, container) {
    nextWorkOfUnit = {
        dom: container,
        props: { children: [vdom] },
    };
    wipRoot = nextWorkOfUnit;
}

let wipRoot = null;
let currentRoot = null;
let nextWorkOfUnit = null;
function workLoop(deadline) {
    let shouldYield = false;
    while (!shouldYield && nextWorkOfUnit) {
        nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextWorkOfUnit && wipRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}

function commitRoot() {
    commitWork(wipRoot.child);
    currentRoot = wipRoot
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) return
    let fiberParent = fiber.parent
    while (!fiberParent.dom) {
        fiberParent = fiberParent.parent
    }
    if (fiber.effectTag === "update") {
        updateProps(fiber.dom, fiber.props, fiber.alternate?.props)
    } else if (fiber.effectTag === "placement") {
        if (fiber.dom) {
            fiberParent.dom.append(fiber.dom)
        }
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function createDom(type) {
    return type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type);
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

function reconcileChild(children, fiber) {
    let oldFiber = fiber.alternate?.child;

    let prevChild = null;
    children.forEach((child, index) => {
        const isSameType = oldFiber && oldFiber.type === child.type;
        let newChild;
        if (isSameType) {
            newChild = {
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
            newChild = {
                type: child.type,
                props: child.props,
                dom: null,
                child: null,
                parent: fiber,
                sibling: null,
                effectTag: "placement",
            };
        }

        if (oldFiber) oldFiber = oldFiber.sibling;

        if (index === 0) {
            fiber.child = newChild;
        } else {
            prevChild.sibling = newChild;
        }
        prevChild = newChild;
    });
}

function updateFunctionComponent(fiber) {
    const children = [fiber.type(fiber.props)];
    reconcileChild(children, fiber);
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        const dom = (fiber.dom = createDom(fiber.type));
        updateProps(dom, fiber.props);
    }
    const children = fiber.props.children;
    reconcileChild(children, fiber);
}

function performWorkOfUnit(fiber) {
    const isFunctionComponent = typeof fiber.type === "function";
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }

    if (fiber.child) return fiber.child;

    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.return;
    }
}
requestIdleCallback(workLoop);

function update() {
    wipRoot = {
        dom: currentRoot.dom,
        props: currentRoot.props,
        alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
}

const React = {
    createElement,
    render,
    update
};

export default React;