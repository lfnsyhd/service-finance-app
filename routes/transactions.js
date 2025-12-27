import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all transactions for logged-in user
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, tipe } = req.query;
        let query = 'SELECT * FROM transaksi WHERE user_id = $1';
        const params = [req.user.id];
        let paramIndex = 2;

        // Add date range filter
        if (startDate) {
            query += ` AND tanggal >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND tanggal <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // Add type filter
        if (tipe && (tipe === 'masuk' || tipe === 'keluar')) {
            query += ` AND tipe = $${paramIndex}`;
            params.push(tipe);
        }

        query += ' ORDER BY tanggal DESC, created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Server error fetching transactions' });
    }
});

// Get single transaction
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM transaksi WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Server error fetching transaction' });
    }
});

// Create new transaction
router.post('/', async (req, res) => {
    const { tanggal, tipe, jumlah, keterangan } = req.body;

    if (!tanggal || !tipe || !jumlah) {
        return res.status(400).json({ error: 'Tanggal, tipe, and jumlah are required' });
    }

    if (tipe !== 'masuk' && tipe !== 'keluar') {
        return res.status(400).json({ error: 'Tipe must be either "masuk" or "keluar"' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO transaksi (user_id, tanggal, tipe, jumlah, keterangan) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, tanggal, tipe, jumlah, keterangan || null]
        );

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Server error creating transaction' });
    }
});

// Update transaction
router.put('/:id', async (req, res) => {
    const { tanggal, tipe, jumlah, keterangan } = req.body;

    if (!tanggal || !tipe || !jumlah) {
        return res.status(400).json({ error: 'Tanggal, tipe, and jumlah are required' });
    }

    if (tipe !== 'masuk' && tipe !== 'keluar') {
        return res.status(400).json({ error: 'Tipe must be either "masuk" or "keluar"' });
    }

    try {
        const result = await pool.query(
            'UPDATE transaksi SET tanggal = $1, tipe = $2, jumlah = $3, keterangan = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *',
            [tanggal, tipe, jumlah, keterangan || null, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({
            message: 'Transaction updated successfully',
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Server error updating transaction' });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM transaksi WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Server error deleting transaction' });
    }
});

// Get summary statistics
router.get('/summary/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateCondition = '';
        const params = [req.user.id];
        let paramIndex = 2;

        if (startDate && endDate) {
            dateCondition = ` AND tanggal BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(startDate, endDate);
        }

        const result = await pool.query(
            `SELECT 
        COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END), 0) as total_masuk,
        COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END), 0) as total_keluar,
        COUNT(CASE WHEN tipe = 'masuk' THEN 1 END) as count_masuk,
        COUNT(CASE WHEN tipe = 'keluar' THEN 1 END) as count_keluar
      FROM transaksi 
      WHERE user_id = $1${dateCondition}`,
            params
        );

        const stats = result.rows[0];
        const saldo = parseFloat(stats.total_masuk) - parseFloat(stats.total_keluar);

        res.json({
            totalMasuk: parseFloat(stats.total_masuk),
            totalKeluar: parseFloat(stats.total_keluar),
            saldo: saldo,
            countMasuk: parseInt(stats.count_masuk),
            countKeluar: parseInt(stats.count_keluar)
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ error: 'Server error fetching summary' });
    }
});

export default router;
