<?php
require_once SRC_PATH . '/controllers/Controller.php';
require_once SRC_PATH . '/models/index.php';

class LeaveController extends Controller {
    private $leaveModel;

    public function __construct() {
        parent::__construct();
        $this->leaveModel = new Leave();
    }

    public function index() {
        Auth::requireAuth();
        $leaves = $this->leaveModel->all();
        $this->success($leaves);
    }

    public function store() {
        Auth::requireAuth();

        $rules = [
            'employee_id' => 'required',
            'leave_type_id' => 'required',
            'start_date' => 'required',
            'end_date' => 'required',
        ];

        $errors = $this->validate($this->input, $rules);
        if (!empty($errors)) {
            $this->error('Validation failed', 422, $errors);
        }

        $result = $this->leaveModel->create($this->input);
        
        if (!$result) {
            $this->error('Failed to create leave request', 500);
        }

        $this->success(null, 'Leave request submitted', 201);
    }

    public function update($id) {
        Auth::requireRole(['hr', 'director']);

        $result = $this->leaveModel->update($id, $this->input);
        
        if (!$result) {
            $this->error('Failed to update leave', 500);
        }

        $this->success(null, 'Leave updated successfully');
    }
}

class DepartmentController extends Controller {
    private $departmentModel;

    public function __construct() {
        parent::__construct();
        $this->departmentModel = new Department();
    }

    public function index() {
        Auth::requireAuth();
        $departments = $this->departmentModel->all();
        $this->success($departments);
    }

    public function store() {
        Auth::requireRole(['hr']);

        $rules = ['name' => 'required'];
        $errors = $this->validate($this->input, $rules);
        if (!empty($errors)) {
            $this->error('Validation failed', 422, $errors);
        }

        $result = $this->departmentModel->create($this->input);
        
        if (!$result) {
            $this->error('Failed to create department', 500);
        }

        $this->success(null, 'Department created', 201);
    }
}

class PerformanceController extends Controller {
    private $performanceModel;

    public function __construct() {
        parent::__construct();
        $this->performanceModel = new PerformanceReview();
    }

    public function index() {
        Auth::requireRole(['hr', 'director']);
        $reviews = $this->performanceModel->all();
        $this->success($reviews);
    }

    public function store() {
        Auth::requireRole(['hr', 'director']);

        $rules = [
            'employee_id' => 'required',
            'rating' => 'required',
        ];

        $errors = $this->validate($this->input, $rules);
        if (!empty($errors)) {
            $this->error('Validation failed', 422, $errors);
        }

        $this->input['reviewed_by'] = Auth::id();
        $result = $this->performanceModel->create($this->input);
        
        if (!$result) {
            $this->error('Failed to create review', 500);
        }

        $this->success(null, 'Performance review created', 201);
    }
}

class PayrollController extends Controller {
    private $payrollModel;

    public function __construct() {
        parent::__construct();
        $this->payrollModel = new PayrollDetail();
    }

    public function index() {
        Auth::requireRole(['hr']);
        
        $month = $_GET['month'] ?? date('Y-m-01');
        $payroll = $this->payrollModel->all();
        
        $this->success($payroll);
    }

    public function process() {
        Auth::requireRole(['hr']);
        // Implement payroll processing logic
        $this->success(null, 'Payroll processed', 200);
    }
}

class PageController extends Controller {
    public function index() {
        header('Location: /emm/public/index.html');
        exit();
    }
}
?>
