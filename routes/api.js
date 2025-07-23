'use strict';

const { Board, Thread, Reply } = require('../models');

module.exports = function (app) {

  /* ----------  THREAD ROUTES  ---------- */

  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        const board = req.params.board;

        const newThread = new Thread({
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        });

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          const newBoard = new Board({ name: board, threads: [newThread] });
          await newBoard.save();
          return res.json(newThread);
        } else {
          boardData.threads.push(newThread);
          await boardData.save();
          return res.json(newThread);
        }
      } catch (err) {
        console.error('Error creating thread:', err);
        res.status(500).send('There was an error saving the post.');
      }
    })

    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const data = await Board.findOne({ name: board });

        if (!data) return res.json([]);

        const threads = data.threads
          .sort((a, b) => b.bumped_on - a.bumped_on)
          .slice(0, 10)
          .map(thread => ({
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies
              .sort((a, b) => b.created_on - a.created_on)
              .slice(0, 3)
              .map(r => ({ _id: r._id, text: r.text, created_on: r.created_on }))
          }));

        res.json(threads);
      } catch (err) {
        console.error('Error retrieving threads:', err);
        res.status(500).send('There was an error retrieving the threads.');
      }
    })

    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        const board = req.params.board;

        const boardData = await Board.findOne({ name: board });
        if (!boardData) return res.status(404).send('Board not found');

        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.status(404).send('Thread not found');

        thread.reported = true;
        await boardData.save();
        res.send('reported');
      } catch (err) {
        console.error('Error reporting thread:', err);
        res.status(500).send('Error saving report.');
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const board = req.params.board;

        const boardData = await Board.findOne({ name: board });
        if (!boardData) return res.status(404).send('Thread not found');

        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.status(404).send('Thread not found');

        if (thread.delete_password !== delete_password) {
          return res.send('incorrect password');
        }

        boardData.threads.pull({ _id: thread_id });
        await boardData.save();
        res.send('success');
      } catch (err) {
        console.error('Error deleting thread:', err);
        res.status(500).send('Error deleting thread.');
      }
    });

  /* ----------  REPLY ROUTES  ---------- */

  app.route('/api/replies/:board')
// In routes/api.js

app.route('/api/replies/:board')
  .post(async (req, res) => {
    try {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;

      // Find the board and the specific thread
      const boardData = await Board.findOne({ name: board });
      if (!boardData) {
        return res.status(404).send('Board not found');
      }

      const thread = boardData.threads.id(thread_id);
      if (!thread) {
        return res.status(404).send('Thread not found');
      }

      // Create the new reply as a plain object
      const newReplyObject = {
        text: text,
        delete_password: delete_password,
        created_on: new Date(),
        reported: false
      };

      // Push the new reply and update the thread's bumped_on date
      thread.replies.push(newReplyObject);
      thread.bumped_on = newReplyObject.created_on;

      // Save the top-level board document
      await boardData.save();
      
      // Get the last reply from the array, which is the one we just added
      const savedReply = thread.replies[thread.replies.length - 1];

      // Return the actual reply object as it was saved to the database
      res.json(savedReply);

    } catch (err) {
      console.error('Error saving reply:', err);
      res.status(500).send('Error saving reply.');
    }
  })

    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const thread_id = req.query.thread_id;

        const boardData = await Board.findOne({ name: board });
        if (!boardData) return res.status(404).send('Board not found');

        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.status(404).send('Thread not found');

        const threadData = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(r => ({
            _id: r._id,
            text: r.text,
            created_on: r.created_on
          }))
        };

        res.json(threadData);
      } catch (err) {
        console.error('Error retrieving thread:', err);
        res.status(500).send('There was an error retrieving the thread.');
      }
    })

    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const board = req.params.board;

        const boardData = await Board.findOne({ name: board });
        if (!boardData) return res.status(404).send('Board not found');

        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.status(404).send('Thread not found');

        const reply = thread.replies.id(reply_id);
        if (!reply) return res.status(404).send('Reply not found');

        reply.reported = true;
        await boardData.save();
        res.send('reported');
      } catch (err) {
        console.error('Error reporting reply:', err);
        res.status(500).send('Error saving report.');
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const board = req.params.board;

        const boardData = await Board.findOne({ name: board });
        if (!boardData) return res.status(404).send('Board not found');

        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.status(404).send('Thread not found');

        const reply = thread.replies.id(reply_id);
        if (!reply) return res.status(404).send('Reply not found');

        if (reply.delete_password !== delete_password) {
          return res.send('incorrect password');
        }

        reply.text = '[deleted]';
        await boardData.save();
        res.send('success');
      } catch (err) {
        console.error('Error deleting reply:', err);
        res.status(500).send('Error deleting reply.');
      }
    });
};