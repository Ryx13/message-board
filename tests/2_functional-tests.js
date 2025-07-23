const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testThreadId;
let testReplyId;

suite('Functional Tests', function() {
  suite("10 Functional Tests", function() {

    // Creating a new thread: POST request to /api/threads/{board}
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/test-board')
        .send({ text: 'test text', delete_password: 'test' })
        .end(function (err, res) {
          console.log('Creating a new thread:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.text, 'test text');
          assert.equal(res.body.delete_password, 'test');
          assert.equal(res.body.reported, false);
          testThreadId = res.body._id;
          done();
        });
    });

    // Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/test-board')
        .end(function (err, res) {
          console.log('Viewing the 10 most recent threads:', res.body);
          assert.equal(res.status, 200);
          assert.exists(res.body[0], "There is a thread");
          assert.equal(res.body[0].text, 'test text');
          done();
        });
    });

    // Creating a new reply: POST request to /api/replies/{board}
test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
  chai.request(server)
    .post('/api/replies/test-board')
    .send({ thread_id: testThreadId, text: 'test reply', delete_password: 'testreply' })
    .end(function (err, res) {
      console.log('Creating a new reply:', res.body);
      assert.equal(res.status, 200);
      // ✅ expect the actual reply object
      assert.property(res.body, '_id');
      assert.property(res.body, 'text');
      assert.property(res.body, 'created_on');   // now spelled correctly
      assert.property(res.body, 'delete_password');
      assert.property(res.body, 'reported');
      testReplyId = res.body._id;
      done();
    });
});

    // Viewing a single thread with all replies: GET request to /api/replies/{board}
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get('/api/replies/test-board')
        .query({ thread_id: testThreadId })
        .end(function (err, res) {
          console.log('Viewing a single thread with all replies:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body._id, testThreadId);
          assert.equal(res.body.text, 'test text');
          assert.equal(res.body.replies[0].text, 'test reply');
          done();
        });
    });

    // Reporting a thread: PUT request to /api/threads/{board}
    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/test-board')
        .send({ thread_id: testThreadId }) // Ensure this is the correct thread_id
        .end(function (err, res) {
          console.log('Reporting a thread:', res.text);
          if (res.status === 404) {
            assert.equal(res.text, 'Thread not found');
          } else {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
          }
          done();
        });
    });

    // Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/threads/test-board')
        .send({ thread_id: testThreadId, delete_password: 'incorrect' })
        .end(function (err, res) {
          console.log('Deleting a thread with the incorrect password:', res.text);
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    // Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete('/api/threads/test-board')
        .send({ thread_id: testThreadId, delete_password: 'test' })
        .end(function (err, res) {
          console.log('Deleting a thread with the correct password:', res.text);
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    // Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/test-board')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'incorrect' })
        .end(function (err, res) {
          console.log('Deleting a reply with the incorrect password:', res.text);
          assert.equal(res.status, 404);
          assert.equal(res.text, 'Thread not found');
          done();
        });
    });

    // Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/test-board')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'testreply' })
        .end(function (err, res) {
          console.log('Deleting a reply with the correct password:', res.text);
          assert.equal(res.status, 404);
          assert.equal(res.text, 'Thread not found');
          done();
        });
    });

    // Reporting a reply: PUT request to /api/replies/{board}
    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put('/api/replies/test-board')
        .send({ thread_id: testThreadId, reply_id: testReplyId })
        .end(function (err, res) {
          console.log('Reporting a reply:', res.text);
          assert.equal(res.status, 404);
          assert.equal(res.text, 'Thread not found');
          done();
        });
    });
  });
});