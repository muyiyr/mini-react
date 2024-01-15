function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map((c) => {
                const isTextNode = typeof c === "string" || typeof c === "number";
                return isTextNode ? createTextElement(c) : c;
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
    fiberRoot = nextWorkOfUnit;
}

let fiberRoot = null;
let nextWorkOfUnit = null;
function workLoop(deadline) {
    let shouldYield = false;
    while (!shouldYield && nextWorkOfUnit) {
        nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextWorkOfUnit && fiberRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}

function commitRoot() {
    commitWork(fiberRoot.child);
    fiberRoot = null;
}

function commitWork(fiber) {
    if (!fiber) return;
    let fiberParent = fiber.return;
    while (!fiberParent.dom) {
        fiberParent = fiberParent.return;
    }
    if (fiber.dom) fiberParent.dom.append(fiber.dom);
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function createDom(type) {
    return type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type);
}

function updateProps(dom, props) {
    for (const key in props) {
        if (key !== "children") {
            dom[key] = props[key];
        }
    }
}

function initChildren(children, fiber) {
    let prevChild = null;
    children.forEach((c, index) => {
        const newFiber = {
            type: c.type,
            props: c.props,
            child: null,
            sibling: null,
            return: fiber,
            dom: null,
        };
        if (index === 0) fiber.child = newFiber;
        else prevChild.sibling = newFiber;
        prevChild = newFiber;
    });
}

function updateFunctionComponent(fiber) {
    const children = [fiber.type(fiber.props)];
    initChildren(children, fiber);
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        const dom = (fiber.dom = createDom(fiber.type));
        updateProps(dom, fiber.props);
    }
    const children = fiber.props.children;
    initChildren(children, fiber);
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

const React = {
    createElement,
    render,
};

export default React;