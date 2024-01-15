import React from "./core/React.js";

const Counter = ({ num }) => {
    return <div>counter: {num}</div>;
};

const App = () => {
    return (
        <div>
            mini-react
            <Counter num={10} />
            <Counter num={20} />
        </div>
    );
};

export default App;