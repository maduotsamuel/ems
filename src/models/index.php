<?php
require_once SRC_PATH . '/models/Model.php';

class Leave extends Model {
    protected $table = 'leaves';
    protected $fillable = ['employee_id', 'leave_type_id', 'start_date', 'end_date', 'reason', 'status'];
}

class Department extends Model {
    protected $table = 'departments';
    protected $fillable = ['name', 'head_id', 'budget'];
}

class PerformanceReview extends Model {
    protected $table = 'performance_reviews';
    protected $fillable = ['employee_id', 'reviewed_by', 'rating', 'goal_achievement', 'notes'];
}

class PayrollRun extends Model {
    protected $table = 'payroll_runs';
    protected $fillable = ['month', 'status', 'total_amount', 'processed_by', 'notes'];
}

class PayrollDetail extends Model {
    protected $table = 'payroll_details';
    protected $fillable = ['payroll_run_id', 'employee_id', 'base_salary', 'bonuses', 'deductions', 'tax', 'net_salary'];
}
?>
