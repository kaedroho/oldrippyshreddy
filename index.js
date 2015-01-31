import Scene from "./scene";


var LoadingScreen = React.createClass({
    render: function() {
        if (this.props.isLoading) {
            return (
                <div id="loading-screen">
                    <h1>Rippy shreddy</h1>
                    <p>Loading...</p>
                </div>
            );
        } else {
            var className = this.props.isHidden ? "hidden" : "";

            return (
                <div id="loading-screen" className={className}>
                    <h1>Rippy shreddy</h1>
                    <a href="#" onClick={this.props.onClickPlay}>Play</a>
                </div>
            );
        }
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

        this.scene = new Scene(document.getElementById('canvas'));
        this.scene.start();

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
