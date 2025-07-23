'use strict';

const { Board, Thread, Reply } = require('../models');

module.exports = function (app) {
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        const board = req.params.board;

        const newThread = new Thread({
          text,
          delete_password,
          replies: []
        });

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          const newBoard = new Board({
            name: board,
            threads: [newThread]
          });

          const savedBoard = await newBoard.save();
          console.log('New board created:', savedBoard);
          return res.json(newThread);
        } else {
          boardData.threads.push(newThread);
          await boardData.save();
          console.log('Thread added to existing board:', boardData);
          return res.json(newThread);
        }
      } catch (err) {
        console.error('Error creating thread:', err);
        res.status(500).send("There was an error saving the post.");
      }
    })
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const data = await Board.findOne({ name: board });

        if (!data) {
          console.log('No board found with that name');
          return res.json({ error: "No board with that name" });
        } else {
          console.log('Board data retrieved:', data);
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
                .map(reply => ({
                  _id: reply._id,
                  text: reply.text,
                  created_on: reply.created_on
                }))
            }));
          return res.json(threads);
        }
      } catch (err) {
        console.error('Error retrieving threads:', err);
        res.status(500).send("There was an error retrieving the threads.");
      }
    })
    .put(async (req, res) => {
      try {
        const { report_id } = req.body;
        const board = req.params.board;

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.status(404).send("Thread not found");
        }

        let thread = boardData.threads.id(report_id);

        if (!thread) {
          return res.status(404).send("Thread not found");
        }

        thread.reported = true;
        thread.bumped_on = new Date();
        await boardData.save();
        return res.send("reported");
      } catch (err) {
        console.error('Error reporting thread:', err);
        return res.status(500).send("Error saving report.");
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const board = req.params.board;

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.status(404).send("Thread not found");
        }

        let thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.status(404).send("Thread not found");
        }

        if (thread.delete_password !== delete_password) {
          return res.send("incorrect password");
        }

        boardData.threads.pull({ _id: thread_id });
        await boardData.save();
        return res.send("success");
      } catch (err) {
        console.error('Error deleting thread:', err);
        return res.status(500).send("Error deleting thread.");
      }
    });

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { thread_id, text, delete_password } = req.body;
        const board = req.params.board;

        const newReply = new Reply({
          text,
          delete_password,
          created_on: new Date(),
          reported: false
        });

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.status(404).send("Thread not found");
        }

        let thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.status(404).send("Thread not found");
        }

        thread.replies.push(newReply);
        thread.bumped_on = new Date();
        await boardData.save();
        return res.json({ success: "Reply added successfully" });
      } catch (err) {
        console.error('Error saving reply:', err);
        return res.status(500).send("Error saving reply.");
      }
    })
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const thread_id = req.query.thread_id;

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.status(404).send("Thread not found");
        }

        let thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.status(404).send("Thread not found");
        }

        const threadData = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          }))
        };

        return res.json(threadData);
      } catch (err) {
        console.error('Error retrieving thread:', err);
        return res.status(500).send("There was an error retrieving the thread.");
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const board = req.params.board;

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.status(404).send("Thread not found");
        }

        let thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.status(404).send("Thread not found");
        }

        let reply = thread.replies.id(reply_id);

        if (!reply) {
          return res.status(404).send("Thread not found");
        }

        reply.reported = true;
        reply.bumped_on = new Date();
        await boardData.save();
        return res.send("reported");
      } catch (err) {
        console.error('Error reporting reply:', err);
        return res.status(500).send("Error saving report.");
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const board = req.params.board;

        let boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.status(404).send("Thread not found");
        }

        let thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.status(404).send("Thread not found");
        }

        let reply = thread.replies.id(reply_id);

        if (!reply) {
          return res.status(404).send("Thread not found");
        }

        if (reply.delete_password !== delete_password) {
          return res.send("incorrect password");
        }

        reply.text = "[deleted]";
        await boardData.save();
        return res.send("success");
      } catch (err) {
        console.error('Error deleting reply:', err);
        return res.status(500).send("Error deleting reply.");
      }
    });
};