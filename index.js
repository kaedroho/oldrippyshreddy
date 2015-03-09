import Client from "./client";


var LoadingScreen = React.createClass({
    render: function() {
        var content;
        if (this.props.isLoading) {
            content = <p>Loading...</p>;
        } else {
            content = <a href="#" onClick={this.props.onClickPlay}>Play</a>;
        }

        return (
            <div id="loading-screen">
                <h1>Rippy shreddy</h1>
                {content}
            </div>
        );
    }
});

export default React.createClass({
    getInitialState() {
        return {
            isLoading: false,
            isRunning: false,
            isPaused: false,
        };
    },

    startGame() {
        if (this.state.isLoading || this.state.isRunning) {
            return;
        }

        this.client = new Client(document.getElementById('canvas'));
        this.client.start();

        this.setState({isRunning: true});
    },

    pauseGame() {
        this.setState({isPaused: true});
    },

    resumeGame() {
        this.setState({isPaused: false});
    },

    stopGame() {
        this.setState({isRunning: false});
    },

    render() {
        // Show loading screen if game is loading
        if (this.state.isLoading) {
            return <LoadingScreen isLoading={true} />;
        }

        // Show loading screen with "Play" button if game is not running
        if (!this.state.isRunning) {
            var self = this;
            var playClicked = function(e) {
                self.startGame();

                e.preventDefault();
            }

            return <LoadingScreen isLoading={false} onClickPlay={playClicked} />;
        }

        return <div />;
    },
});
