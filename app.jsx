APP = React.createClass(
    {
        getInitialState: function () {
            return {

                numStories: 0,
                total: 0,
                stories: [],
                range: [],
                fwd: '',
                back: ''

            }
        },

        /* componentDidMount */
        componentDidMount: function () {
            var self = this,
                socket = io.connect('http://localhost:5006');

            this.props.intro = 'show';
            this.props.range = 'hide';

            socket.on('story-count', function (data) {
                if (self.isMounted()) {

                    self.setState({
                        numStories: data.count,
                        total: data.total
                    });

                    if (data.count == data.total) {

                        socket.emit('disconnect');

                        socket.disconnect();



                        $.get('http://localhost:5005/api/sorted-stories/asc/0-9', function (data) {
                            if (self.isMounted()) {

                                self.setState({

                                    stories: data.data,
                                    range: data.range,
                                    fwd: data.links.fwd,
                                    back: data.links.back

                                });

                                self.setProps({intro: 'hide', range: 'show'});
                            }
                        });
                    }
                }
            });
        },

        getMoreStories: function (url) {
            var self = this;
            $.get(url, function (data) {

                self.setState({

                    stories: data.data,
                    range: data.range,
                    fwd: data.links.fwd,
                    back: data.links.back

                });
            });
        },

        render: function () {
            return (
                <div>

                    <h1 className={this.props.intro}>Wait for it...

                        <span>{this.state.numStories} / {this.state.total}</span>

                    </h1>

                    <h1 className={this.props.range}>Stories:

                        <span> {this.state.range[0]}-{this.state.range[1]} / {this.state.total}</span>

                    </h1>

                    <div>
                        {this.state.stories.map(function (story, index) {
                            return (
                                <ul key={'story_' + index}>
                                    <li>

                                        <span className="title">Tite: </span> {story.title}</li>

                                    <li>

                                        <span className="title">Url: </span> {story.url}</li>

                                    <li>

                                        <span className="title"> Score: </span>{story.score}</li>
                                </ul>
                            );
                        })}
                    </div>

                    <div className="buttons">

                        <button onClick={this.getMoreStories.bind(this, this.state.back)} ref="back">
                            Back
                        </button>

                        <button onClick={this.getMoreStories.bind(this, this.state.fwd)} ref="fwd">
                            Fwd
                        </button>
                    </div>

                </div>
            )
        }
    });



React.render(<APP />, document.querySelector('#hackerNewsStores'));



