var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MatrixStorage = (function () {
    function MatrixStorage(data, firstDimension, secondDimension, stride) {
        this.data = data;
        this.firstDimension = firstDimension;
        this.secondDimension = secondDimension;
        if (stride) {
            this.offset = stride.offset || 0;
            this.strideInner = stride.inner || 0;
            this.strideOuter = stride.outer || 0;
            this.get = this.getStride;
        }
    }
    MatrixStorage.prototype.get = function (firstIndex, secondIndex) {
        return firstIndex * this.secondDimension + secondIndex;
    };
    MatrixStorage.prototype.getStride = function (firstIndex, secondIndex) {
        return this.offset + firstIndex * (this.secondDimension + this.strideOuter + this.strideInner * (this.secondDimension - 1)) + secondIndex * (this.strideInner + 1);
    };
    MatrixStorage.prototype.at = function (firstIndex, secondIndex) {
        return this.data[this.get(firstIndex, secondIndex)];
    };
    MatrixStorage.prototype.set = function (firstIndex, secondIndex, value) {
        this.data[this.get(firstIndex, secondIndex)] = value;
    };
    return MatrixStorage;
})();
var RowMajor = (function (_super) {
    __extends(RowMajor, _super);
    function RowMajor(data, rows, cols, stride) {
        _super.call(this, data, rows, cols, stride);
    }
    return RowMajor;
})(MatrixStorage);
function ColMajor(data, rows, cols, stride) {
    MatrixStorage.call(this, data, cols, rows, stride);
}
ColMajor.prototype = new MatrixStorage;
ColMajor.prototype.get = function (row, col) {
    return MatrixStorage.prototype.get(this, col, row);
};
ColMajor.prototype.getStride = function (row, col) {
    return MatrixStorage.prototype.getStride.call(this, col, row);
};
function Matrix() { }
Matrix.Create = function (rows, cols, data, MatrixStorage) {
    MatrixStorage = MatrixStorage || RowMajor;
    var m = new Matrix();
    m.rows = rows;
    m.cols = cols;
    m.MatrixStorage = MatrixStorage.firstDimension ? MatrixStorage : new MatrixStorage(data, rows, cols);
    return m;
};
Matrix.Map = function (rows, cols, data, order, offset, innerStride, outerStride) {
    return Matrix.Create(rows, cols, data, new order(data, rows, cols, {
        'offset': offset,
        'inner': innerStride,
        'outer': outerStride
    }));
};
Matrix.prototype.at = function (row, col) {
    return this.MatrixStorage.at(row, col);
};
Matrix.prototype.set = function (row, col, val) {
    this.MatrixStorage.set(row, col, val);
};
Matrix.prototype.copy = function () {
    var m = Matrix.Create(this.rows, this.cols, new Array(this.rows * this.cols), this.MatrixStorage.constructor);
    for (var row = 0; row < this.rows; row++) {
        for (var col = 0; col < this.cols; col++) {
            m.set(row, col, this.at(row, col));
        }
    }
    return m;
};
Matrix.prototype.print = function () {
    var str = new String;
    for (var row = 0; row < this.rows; row++) {
        for (var col = 0; col < this.cols; col++) {
            str = str.concat(this.at(row, col) + ' ');
        }
        str = str.concat('\n');
    }
    str = str.concat('\n');
    console.log(str);
};
Matrix.prototype.isSameSizeAs = function (other) {
    return this.rows === other.rows && this.cols === other.cols;
};
Matrix.prototype.transpose = function () {
    return new TransposedMatrix(this);
};
Matrix.prototype.row = function (i) {
    return this.block(i, 0, 1, this.cols);
};
Matrix.prototype.col = function (i) {
    return this.block(0, i, this.rows, 1);
};
Matrix.prototype.block = function (startRow, startCol, blockRows, blockCols) {
    return new BlockMatrix(this.m, startRow, startCol, blockRows, blockCols);
};
Matrix.prototype.negate = function () {
    return new NegateMatrix(this);
};
Matrix.prototype.add = function (other) {
    if (!this.isSameSizeAs(other))
        throw new MatrixException("Matrix not of same dimensions");
    return new AddMatrix(this, other);
};
Matrix.prototype.subtract = function (other) {
    if (!this.isSameSizeAs(other))
        throw new MatrixException("Matrix not of same dimensions");
    return new AddMatrix(this, other.negate());
};
function ReadOnlyMatrix() { }
ReadOnlyMatrix.prototype = new Matrix;
ReadOnlyMatrix.prototype.set = function (row, col, val) {
    this.m = this.copy();
    this.m.set(row, col, val);
    this.set = this._set;
    this.at = this._at;
    this.clean();
};
ReadOnlyMatrix.prototype._at = function (row, col) {
    return this.m.at(row, col);
};
ReadOnlyMatrix.prototype._set = function (row, col, val) {
    this.m.set(row, col, val);
};
ReadOnlyMatrix.prototype.clean = function () { };
function TransposedMatrix(m) {
    this.m = m;
    this.rows = m.cols;
    this.cols = m.rows;
}
TransposedMatrix.prototype = new ReadOnlyMatrix;
TransposedMatrix.prototype.at = function (row, col) {
    return this.m.at(col, row);
};
function BlockMatrix(m, startRow, startCol, blockRows, blockCols) {
    this.m = m;
    this.rows = blockRows;
    this.cols = blockCols;
    this.startRow = startRow;
    this.startCol = startCol;
}
BlockMatrix.prototype = new Matrix;
BlockMatrix.prototype.at = function (row, col) {
    return this.m.at(this.startRow + row, this.startCol + col);
};
BlockMatrix.prototype.clean = function () {
    delete this.startRow;
    delete this.startCol;
};
function AddMatrix(left, right) {
    this.left = left;
    this.right = right;
    this.rows = left.rows;
    this.cols = left.cols;
}
AddMatrix.prototype = new ReadOnlyMatrix;
AddMatrix.prototype.at = function (row, col) {
    return this.left.at(row, col) + this.right.at(row, col);
};
AddMatrix.prototype.clean = function () {
    delete this.left;
    delete this.right;
};
function NegateMatrix(m) {
    this.m = m;
    this.rows = m.rows;
    this.cols = m.cols;
}
NegateMatrix.prototype = new ReadOnlyMatrix;
NegateMatrix.prototype.at = function (row, col) {
    return -this.m.at(row, col);
};
