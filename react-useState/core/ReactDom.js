import React from "./React";
const ReactDOM = {
    createRoot(container) {
        return {
            render(app) {
                React.render(app, container);
            },
        };
    },
};

export default ReactDOM;