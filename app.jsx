/**
 * Created by stephen on 3/6/15.
 */

APP = React.createClass({
    /* init to get top-stories */

    getInitialState:function() {
        return {
            numStories:0,
            total:0,
            stories:[],
            range:[],
            fwd:'',
            back:''
        }
    },
    /* componentWillReceiveProps */
    componentWillReceiveProps:function(nextProps, nextState) {
        console.log('componentWillReceiveProps', nextProps, nextState);
        //this.setProps({intro:'hide'});
    },
    //
    //
    ///* shouldComponentUpdate */
    shouldComponentUpdate:function(nextProps, nextState) {
        //console.log('shouldComponentUpdate', this.state.fwd, nextState.fwd);

        return true;
    },
    //
    //
    ///* componentWillUpdate */
    componentWillUpdate:function(nextProps, nextState) {
        //console.log('componentWillUpdate', nextProps, nextState);

    },
    //
    ///* componentWillMount */
    //componentWillMount:function() {
    //    console.log('componentWillMount');
    //},


    /* componentDidMount */
    componentDidMount:function() {
        console.log('com did mount');
        this.props.intro = 'show';
        this.props.range = 'hide';

        var self = this,
            socket = io.connect('http://localhost:5006');

        socket.on('story-count', function(data) {
            if(self.isMounted()) {
                self.setState({

                    numStories:data.count,
                    total:data.total

                });


                if(data.count == data.total) {
                    socket.emit('disconnect');
                    socket.disconnect();

                    //this.shouldComponentUpdate(null, 'http://localhost:5005/api/sorted-stories/asc/0-9');

                    $.get('http://localhost:5005/api/sorted-stories/asc/0-9', function(data) {
                        console.log('did mount data');
                        if(self.isMounted()) {
                            self.setState({

                                stories:data.data,
                                range:data.range,
                                fwd:data.links.fwd,
                                back:data.links.back

                            });

                            self.setProps({intro:'hide', range:'show'});
                        }
                    });
                }
            }
        });
    },



    getMoreStories:function(url) {
        var self = this;
        $.get(url, function(data) {
            self.setState({

                stories:data.data,
                range:data.range,
                fwd:data.links.fwd,
                back:data.links.back

            });
        });
    },



    render:function() {
        console.log('render ');


        return (
            <div>
                <h1 className={this.props.intro}>Wait for it...
                    <span>{this.state.numStories} / {this.state.total}</span>
                </h1>

                <h1 className={this.props.range}>Stories:
                    <span> {this.state.range[0]}-{this.state.range[1]} / {this.state.total}</span>
                </h1>

                <div>
                    {this.state.stories.map(function(story, index) {
                        return (
                            <ul>
                                <li key={story.title + '_key' + index}>
                                    <span className="title">Tite: </span> {story.title}</li>
                                <li key={story.url + '_key' + index}>
                                    <span className="title">Url: </span> {story.url}</li>
                                <li key={story.score + '_key' + index}>
                                    <span className="title"> Score: </span>{story.score}</li>
                            </ul>
                        );
                    })}
                </div>

                <div className="buttons">
                    <button onClick={this.getMoreStories.bind(this, this.state.back)} ref="back">
                        <h3> Back </h3>
                    </button>

                    <button onClick={this.getMoreStories.bind(this, this.state.fwd)} ref="fwd">
                        <h3> Fwd </h3>
                    </button>
                </div>

            </div>
        )
    }
    /* componentWillUnmount */
});

React.render(<APP />, document.querySelector('#storyWrapper'));



