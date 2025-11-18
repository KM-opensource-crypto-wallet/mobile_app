// shims/net.js
module.exports = {
    connect: () => {
        throw new Error('net.connect is not supported in React Native');
    },
    createConnection: () => {
        throw new Error('net.createConnection is not supported in React Native');
    },
    createServer: () => {
        throw new Error('net.createServer is not supported in React Native');
    },
    isIP: (input) => {
        return 0;
    },
    isIPv4: (input) => {
        return false;
    },
    isIPv6: (input) => {
        return false;
    },
    Socket: class Socket {},
    Server: class Server {},
};
