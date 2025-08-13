import { pool } from '../../config/database.js';

export class CommentService {
    static async createComment(subtaskId, username, content) {
        const [result] = await pool.execute(
            'INSERT INTO comments (subtaskId, username, content, time) VALUES (?, ?, ?, NOW())',
            [subtaskId, username, content]
        );
        return result.insertId;
    }

    static async getCommentsBySubtaskId(subtaskId) {
        const [rows] = await pool.execute(
            'SELECT * FROM comments WHERE subtaskId = ? ORDER BY time DESC',
            [subtaskId]
        );
        return rows;
    }

    static async deleteComment(commentId, username) {
        const [result] = await pool.execute(
            'DELETE FROM comments WHERE id = ? AND username = ?',
            [commentId, username]
        );
        return result.affectedRows > 0;
    }
}
