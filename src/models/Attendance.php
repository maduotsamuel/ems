<?php
require_once SRC_PATH . '/models/Model.php';

class Attendance extends Model {
    protected $table = 'attendance';
    protected $fillable = ['employee_id', 'attendance_date', 'check_in', 'check_out', 'status', 'notes'];

    public function findByDate($date) {
        return $this->where('attendance_date', $date);
    }

    public function findByEmployee($employeeId, $limit = 30) {
        $table = $this->qualifiedTable();
        $query = "SELECT * FROM {$table} WHERE employee_id = ? ORDER BY attendance_date DESC LIMIT ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("si", $employeeId, $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();
        return $this->formatResults($result);
    }
}
?>
