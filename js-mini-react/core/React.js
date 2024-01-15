function createTextNode(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                return typeof child === "string" ? createTextNode(child) : child;
            }),
        },
    };
}
function render(el, container) {
    const dom =
        el.type !== "TEXT_ELEMENT"
            ? document.createElement(el.type)
            : document.createTextNode(el.props.nodeValue);
    Object.keys(el.props).forEach((key) => {
        if (key !== "children") {
            dom[key] = el.props[key];
        }
    });
    //  这里处理 children`
    const children = el.props.children;
    if (children) {
        children.forEach((child) => {
            render(child, dom);
        });
    }
    container.append(dom);
}
const React = {
    render,
    createElement,
    // createTextNode,
};

export default React