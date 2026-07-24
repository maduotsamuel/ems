<?php
require_once SRC_PATH . '/controllers/Controller.php';
require_once SRC_PATH . '/models/Attendance.php';

class AttendanceController extends Controller {
    private $attendanceModel;

    public function __construct() {
        parent::__construct();
        $this->attendanceModel = new Attendance();
    }

    public function index() {
        Auth::requireAuth();
        
        $date = $_GET['date'] ?? date('Y-m-d');
        $attendance = $this->attendanceModel->findByDate($date);
        
        $this->success($attendance);
    }

    public function store() {
        Auth::requireAuth();

        $rules = [
            'employee_id' => 'required',
            'attendance_date' => 'required',
        ];

        $errors = $this->validate($this->input, $rules);
        if (!empty($errors)) {
            $this->error('Validation failed', 422, $errors);
        }

        $result = $this->attendanceModel->create($this->input);
        
        if (!$result) {
            $this->error('Failed to record attendance', 500);
        }

        $this->success(null, 'Attendance recorded successfully', 201);
    }

    public function update($id) {
        Auth::requireRole(['hr', 'director']);

        $result = $this->attendanceModel->update($id, $this->input);
        
        if (!$result) {
            $this->error('Failed to update attendance', 500);
        }

        $this->success(null, 'Attendance updated successfully');
    }
}
?>
