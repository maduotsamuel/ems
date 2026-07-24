<?php
/**
 * Base Model
 * All models inherit from this class
 */
abstract class Model {
    protected $db;
    protected $table;
    protected $fillable = [];
    protected $hidden = [];
    protected $timestamps = true;
    protected $allowedOperators = ['=', '!=', '<>', '>', '>=', '<', '<=', 'LIKE'];

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function all($limit = null) {
        $table = $this->qualifiedTable();
        $query = "SELECT * FROM {$table}";
        
        if ($limit) {
            $query .= " LIMIT " . (int)$limit;
        }

        $result = $this->db->query($query);
        return $this->formatResults($result);
    }

    public function find($id) {
        $table = $this->qualifiedTable();
        $stmt = $this->db->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        return $row ? $this->hideFields($row) : null;
    }

    public function where($column, $value, $operator = '=') {
        $table = $this->qualifiedTable();
        $column = $this->qualifiedColumn($column);
        $operator = $this->sanitizeOperator($operator);
        $query = "SELECT * FROM {$table} WHERE {$column} {$operator} ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("s", $value);
        $stmt->execute();
        $result = $stmt->get_result();
        return $this->formatResults($result);
    }

    public function create($data) {
        $data = $this->filterData($data);
        
        if (empty($data)) {
            return false;
        }

        $table = $this->qualifiedTable();
        $columns = array_map([$this, 'qualifiedColumn'], array_keys($data));
        if ($this->timestamps) {
            $data['created_at'] = date('Y-m-d H:i:s');
            $data['updated_at'] = date('Y-m-d H:i:s');
            $columns = array_map([$this, 'qualifiedColumn'], array_keys($data));
        }

        $columns = implode(', ', $columns);
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $query = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($query);

        $types = str_repeat('s', count($data));
        $stmt->bind_param($types, ...array_values($data));
        
        if ($stmt->execute()) {
            $stmt->close();
            return $this->db->insert_id ?: true;
        }

        $stmt->close();
        return false;
    }

    public function update($id, $data) {
        $data = $this->filterData($data);
        
        if ($this->timestamps) {
            $data['updated_at'] = date('Y-m-d H:i:s');
        }

        if (empty($data)) {
            return false;
        }

        $table = $this->qualifiedTable();
        $setClause = implode(', ', array_map(fn($k) => $this->qualifiedColumn($k) . " = ?", array_keys($data)));
        $query = "UPDATE {$table} SET {$setClause} WHERE id = ?";
        
        $stmt = $this->db->prepare($query);
        
        $data['id'] = $id;
        $types = str_repeat('s', count($data));
        $stmt->bind_param($types, ...array_values($data));
        
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }

    public function delete($id) {
        $table = $this->qualifiedTable();
        $stmt = $this->db->prepare("DELETE FROM {$table} WHERE id = ?");
        $stmt->bind_param("s", $id);
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }

    public function count() {
        $table = $this->qualifiedTable();
        $result = $this->db->query("SELECT COUNT(*) as count FROM {$table}");
        $row = $result->fetch_assoc();
        return (int)$row['count'];
    }

    protected function filterData($data) {
        if (empty($this->fillable)) {
            return $data;
        }

        return array_intersect_key($data, array_flip($this->fillable));
    }

    protected function qualifiedTable() {
        return $this->quoteIdentifier($this->sanitizeIdentifier($this->table));
    }

    protected function qualifiedColumn($column) {
        $allowedColumns = $this->allowedColumns();
        if (!in_array($column, $allowedColumns, true)) {
            throw new InvalidArgumentException('Invalid column name');
        }

        return $this->quoteIdentifier($column);
    }

    protected function allowedColumns() {
        $columns = array_merge($this->fillable, $this->hidden, ['id']);

        if ($this->timestamps) {
            $columns[] = 'created_at';
            $columns[] = 'updated_at';
        }

        return array_values(array_unique(array_filter($columns, fn($column) => is_string($column) && preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $column))));
    }

    protected function sanitizeOperator($operator) {
        $operator = strtoupper(trim((string)$operator));
        if (!in_array($operator, $this->allowedOperators, true)) {
            throw new InvalidArgumentException('Invalid operator');
        }

        return $operator;
    }

    protected function sanitizeIdentifier($identifier) {
        if (!is_string($identifier) || !preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $identifier)) {
            throw new InvalidArgumentException('Invalid SQL identifier');
        }

        return $identifier;
    }

    protected function quoteIdentifier($identifier) {
        return '`' . $identifier . '`';
    }

    protected function hideFields($row) {
        foreach ($this->hidden as $field) {
            unset($row[$field]);
        }
        return $row;
    }

    protected function formatResults($result) {
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $this->hideFields($row);
        }
        return $rows;
    }
}
?>
