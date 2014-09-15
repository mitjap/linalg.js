function RowMajor(rows, cols, offset, innerStride, outerStride) {
    this.firstDimension = rows;
    this.secondDimension = cols;

    this.offset = offset || 0;
    this.innerStride = innerStride || 0;
    this.outerStride = outerStride || 0;
}

RowMajor.prototype.get = function (row, col) {
    return this.offset + row * (this.secondDimension + this.outerStride + this.innerStride * (this.secondDimension - 1)) + col * (this.innerStride + 1);
};

RowMajor.prototype.clean = function () {
    return new RowMajor(this.firstDimension, this.secondDimension);
}

RowMajor.prototype.block = function (startRow, startCol, blockRows, blockCols) {
    return new RowMajor(
        blockRows, 
        blockCols,
        this.get(startRow, startCol),
        this.innerStride,
        this.outerStride + this.secondDimension - blockCols
    );
}

function ColMajor(rows, cols, offset, innerStride, outerStride) {
    this.firstDimension = cols;
    this.secondDimension = rows;

    this.offset = offset || 0;
    this.innerStride = innerStride || 0;
    this.outerStride = outerStride || 0;
}

ColMajor.prototype = new RowMajor();
ColMajor.prototype.get = function (row, col) {
    return RowMajor.prototype.get.call(this, col, row);
};

ColMajor.prototype.clean = function () {
    return new ColMajor(this.firstDimension, this.secondDimension);
}

ColMajor.prototype.block = function (startRow, startCol, blockRows, blockCols) {
    return new ColMajor(
        blockRows, 
        blockCols,
        this.get(startRow, startCol),
        this.innerStride,
        this.outerStride + this.secondDimension - blockRows
    );
}

RowMajor.prototype.inverse = function () {
    return new ColMajor(this.firstDimension, this.secondDimension, this.offset, this.innerStride, this.outerStride);
};

ColMajor.prototype.inverse = function () {
    return new RowMajor(this.firstDimension, this.secondDimension, this.offset, this.innerStride, this.outerStride);
};

function Matrix() {}

Matrix.Create = function(rows, cols, data, storageOrder) {
    storageOrder = storageOrder || RowMajor;

    var m = new Matrix();
    m.rows = rows;
    m.cols = cols;
    m.data = data; 
    m.storageOrder = storageOrder.firstDimension ? storageOrder : new storageOrder(rows, cols);
    
    return m;
}

Matrix.Map = function(rows, cols, data, order, offset, innerStride, outerStride) {
    return Matrix.Create(rows, cols, data, new order(rows, cols, offset, innerStride, outerStride));
}

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
}

Matrix.prototype.isSameSizeAs = function(other) {
    return this.rows == other.rows && this.cols == other.cols;
}

Matrix.prototype.at = function (row, col) {
    return this.data[this.storageOrder.get(row, col)];
}

/*
TODO: copy data on write if data is shared
Matrix.prototype.set = function (row, col, val) {
    this.data[this.storageOrder.get(row, col)] = val;
}
*/

Matrix.prototype.transpose = function () {
    return new TransposedMatrix(this);
}

/** Performs deep copy of matrix */ 
Matrix.prototype.copy = function () {
    var m = Matrix.Create(this.rows, this.cols, new Array(this.rows * this.cols),  RowMajor);

    for (var row = 0; row < this.rows; row++) {
        for (var col = 0; col < this.cols; col++) {
            m.data[m.storageOrder.get(row, col)] = this.at(row, col);
        }
    }
    
    return m;
}

Matrix.prototype.row = function (i) {
    return this.block(i, 0, 1, this.cols);
}

Matrix.prototype.col = function (i) {
    return this.block(0, i, this.rows, 1);
}

Matrix.prototype.block = function (startRow, startCol, blockRows, blockCols) {
    return new BlockMatrix(m, startRow, startCol, blockRows, blockCols);
}

Matrix.prototype.negate = function () {
    return new NegateMatrix(this);
}

Matrix.prototype.add = function (other) {
    if (!this.isSameSizeAs(other)) throw new MatrixException("Matrix not of same dimensions");
    
    return new AddMatrix(this, other);
}

Matrix.prototype.subtract = function (other) {
    if (!this.isSameSizeAs(other)) throw new MatrixException("Matrix not of same dimensions");
    
    return new AddMatrix(this, other.negate());
}

function TransposedMatrix(m) {
    this.m = m;
    this.rows = m.cols;
    this.cols = m.rows;
}
TransposedMatrix.prototype = new Matrix;
TransposedMatrix.prototype.at = function (row, col) {
    return this.m.at(col, row);
}

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
}

function AddMatrix(left, right) {
    this.left = left;
    this.right = right;
    
    this.rows = left.rows;
    this.cols = left.cols;
}
AddMatrix.prototype = new Matrix;
AddMatrix.prototype.at = function (row, col) {
    return this.left.at(row, col) + this.right.at(row, col);
}

function NegateMatrix(m) {
    this.m = m;
    
    this.rows = m.rows;
    this.cols = m.cols;
}
NegateMatrix.prototype = new Matrix;
NegateMatrix.prototype.at = function (row, col) {
    return -this.m.at(row, col);
}




