module.exports = function(RED) {
    'use strict';

    function connect(uri, options) {
        return require('socket.io-client')(uri, options);
    }

    /* socket config */
    function SocketIOConfig(config) {
        RED.nodes.createNode(this, config);
        this.uri = config.uri;
        this.options = config.options;
    }
    RED.nodes.registerType('socketio-config', SocketIOConfig);
   
    /* sckt listener*/
    function SocketIOListener(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.eventName = config.eventname;
		this.roomName = config.roomname;
        
        var server = RED.nodes.getNode(config.server);
        this.socket = connect(server.uri, JSON.parse(server.options || '{}'));

        var node = this;

        this.socket.on('connect', function() {
			node.socket.emit('join', node.roomName);
            node.status({ fill: 'green', shape: 'dot', text: 'connected' });
        });

        this.socket.on('disconnect', function () {
            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
        });

        this.socket.on('connect_error', function(err) {
            if (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'error' });
                node.send({ payload: err });
            }
        });

        this.socket.on(node.eventName, function (data) {
            node.send({ payload: data });
        })

        node.on('close', function (done) {
			node.socket.emit('leave', node.roomName);
            node.socket.disconnect();
            node.status({});
            done();
        });
    }
    RED.nodes.registerType('socketio-listener', SocketIOListener);

    /* sckt emitter*/
    function SocketIOEmitter(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.eventName = config.eventname;
		this.roomName = config.roomname;

        var server = RED.nodes.getNode(config.server);
        this.socket = connect(server.uri);

        var node = this;

        this.socket.on('connect', function() {
			node.socket.emit('join', node.roomName);
            node.status({ fill: 'green', shape: 'dot', text: 'connected' });
        });

        this.socket.on('disconnect', function () {
            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
        });

        this.socket.on('connect_error', function(err) {
            if (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'error' });
                node.send({ payload: err });
            }
        });

        node.on('input', function (msg) {
            const data = msg.payload;
            if (data) {
                node.socket.emit(node.eventName, data);
            }
        });

        node.on('close', function (done) {
			node.socket.emit('leave', node.roomName);
            node.status({});
            done();
        });
    }
    RED.nodes.registerType('socketio-emitter', SocketIOEmitter);
};
