var bs = require("../../../lib/browser-sync");
var browserSync = new bs();
var messages = require("../../../lib/messages");
var http = require("http");
var filePath = require("path");
var connect = require("connect");
var request = require("supertest");
var sinon = require("sinon");
var proxy = require("../../../lib/proxy");
var assert = require("chai").assert;
var portScanner = require("portscanner-plus");

var ports = {
    socket: 3000,
    controlPanel: 3001,
    proxy: 3002
};
var options = {
    proxy: {
        host: "0.0.0.0"
    }
};

var snippet = messages.scriptTags("0.0.0.0", ports, options);

describe("Launching a proxy for connect server", function () {

    var app, server;

    before(function (done) {
        portScanner.getPorts(1, 3002, 3005).then(function (port) {
            var testApp = connect().use(connect.static(filePath.resolve("test/fixtures")));
            server = http.createServer(testApp).listen(port[0]);
            options.proxy.port = port[0];
            app = proxy.createProxy("0.0.0.0", ports, options);
            done();
        }).catch(function (err) {
            console.log(err);
        });
    });

    after(function () {
        server.close();
    });

    it("can proxy requests + inject snippets into a small HTML response", function (done) {
        request(app)
            .get("/index.html")
            .set("Accept", "text/html")
            .expect(200)
            .end(function (err, res) {
                var actual = res.text.indexOf(snippet);
                assert.isTrue(actual >= 0);
                done();
            });
    });

    it("can proxy requests + inject snippets into a LARGE HTML response", function (done) {
        request(app)
            .get("/index-large.html")
            .set("Accept", "text/html")
            .expect(200)
            .end(function (err, res) {
                var actual = res.text.indexOf(snippet);
                assert.isTrue(actual >= 0);
                done();
            });
    });
});
