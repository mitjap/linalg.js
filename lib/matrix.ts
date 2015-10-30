// row-major: firstDimension=row, secondDimension=col
// col-major: firstDimension=col, secondDimension=row
class MatrixStorage {
    public data: number[];
    public firstDimension: number;
    public secondDimension: number;
    
    private offset: number;
    private stride: number;
    private strideInner: number;
    private strideOuter: number;

    constructor(data: number[], firstDimension: number, secondDimension: number, stride?: {offset: number, inner: number, outer: number}) {
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

    protected get(firstIndex, secondIndex) {
        return firstIndex * this.secondDimension + secondIndex;
    }

    protected getStride(firstIndex, secondIndex) {
        return this.offset + firstIndex * (this.secondDimension + this.strideOuter + this.strideInner * (this.secondDimension - 1)) + secondIndex * (this.strideInner + 1);
    }

    at(firstIndex, secondIndex) {
        return this.data[this.get(firstIndex, secondIndex)];
    }

    set(firstIndex, secondIndex, value) {
        this.data[this.get(firstIndex, secondIndex)] = value;
    }
}

class RowMajor extends MatrixStorage {
    constructor(data: number[], rows: number, cols: number, stride ?:any) {
        super(data, rows, cols, stride)
    }
}

class ColMajor extends MatrixStorage {

    constructor(data: number[], rows: number, cols: number, stride ?: any) {
        super(data, cols, rows, stride);
    }

    get(row, col) {
        return super.get(col, row);
    }

    getStride(row, col) {
        return super.getStride(col, row);
    }
}

interface IMatrix {
    rows(): number;
    cols(): number;

    at(row: number, col: number): number;
    set(row: number, col: number, val: number);
    copy(): IMatrix;
    toString(): String;
    isSameSizeAs(other: IMatrix): boolean;

    transpose(): IMatrix;
    block(startRow: number, startCol: number, blockRows: number, blockCols: number): IMatrix;
    row(i: number): IMatrix;
    col(i: number): IMatrix;
    add(other: IMatrix): IMatrix;
    subtract(other: IMatrix): IMatrix;
    negate(): IMatrix;
}

abstract class MatrixBase implements IMatrix {
  private _rows: number;
  private _cols: number;

  constructor(rows: number, cols: number) {
    this._rows = rows;
    this._cols = cols;
  }

  abstract at(row: number, col: number): number;
  abstract set(row: number, col: number, value: number);

  rows(): number {
    return this._rows;
  }

  cols(): number {
    return this._cols;
  }
  /**
   * Performs deep copy of a matrix
   */
  copy() {
    var data: number[] = new Array<number>(this.rows() * this.cols());
    var m: IMatrix = Matrix.Create(this.rows(), this.cols(), new RowMajor(data, this.rows(), this.cols()));

    for (var row = 0; row < this.rows(); row++) {
      for (var col = 0; col < this.cols(); col++) {
        m.set(row, col, this.at(row, col));
      }
    }

    return m;
  }

  toString() {
    var str = new String;
    for (var row = 0; row < this.rows(); row++) {
      for (var col = 0; col < this.cols(); col++) {
        str = str.concat(this.at(row, col) + ' ');
      }
      str = str.concat('\n');
    }
    str = str.concat('\n');
    return str;
  }

  isSameSizeAs(other: IMatrix) {
    return this.rows === other.rows && this.cols === other.cols;
  }

  transpose() {
    return new TransposedMatrix(this);
  }

  row(i: number) {
    return this.block(i, 0, 1, this.cols());
  }

  col(i: number) {
    return this.block(0, i, this.rows(), 1);
  }

  block(startRow: number, startCol: number, blockRows: number, blockCols: number) {
    return new BlockMatrix(this, startRow, startCol, blockRows, blockCols);
  }

  negate() {
    return new NegateMatrix(this);
  }

  add(other: IMatrix) {
    if (!this.isSameSizeAs(other)) throw new Error("Matrices not of same dimensions");

    return new AddMatrix(this, other);
  }

  subtract(other: IMatrix) {
    if (!this.isSameSizeAs(other)) throw new Error("Matrices not of same dimensions");

    return new AddMatrix(this, other.negate());
  }
}

class Matrix extends MatrixBase {

    constructor(rows: number, cols: number, private storage: MatrixStorage) {
    super(rows, cols)
        this.storage = storage;
    }

    static Create(rows: number, cols: number, storage: MatrixStorage) {
        return new Matrix(rows, cols, storage);
    }

    static Map(rows: number, cols: number, data: number[], order, offset: number, innerStride: number, outerStride: number) {
        return Matrix.Create(rows, cols, new order(data, rows, cols, {
            'offset': offset,
            'inner': innerStride,
            'outer': outerStride
        }));
    }


    at(row: number, col: number) {
        return this.storage.at(row, col);
    }

    set(row: number, col: number, val: number) {
        this.storage.set(row, col, val);
    }
}

abstract class MatrixOp extends MatrixBase {
  set(row, col, val) {
    throw new Error("Can not set on MatrixOp");
  }
}

class ReadOnlyMatrix extends MatrixBase {

  constructor(protected m: IMatrix) {
    super(m.rows(), m.cols());
    this.m = m;
  }

  set(row: number, col: number, val: number) {
    this.m = this.copy();
    this.m.set(row, col, val);

    // reset getter and setter functions
    this.set = this._set;
  }

  at(row: number, col: number) {
    return this.m.at(row, col);
  }

  private _set(row: number, col: number, val: number) {
    this.m.set(row, col, val);
  }

}
class TransposedMatrix extends ReadOnlyMatrix {
  rows() {
    return this.m.cols();
  }

  cols() {
    return this.m.cols();
  }

  at(row, col) {
    return this.m.at(col, row);
  }

  set(row, col, val) {
    this.m.set(col, row, val);
  }
}

class BlockMatrix extends MatrixBase {
  constructor(protected m: IMatrix, private startRow: number, private startCol: number, private blockRows: number, private blockCols: number) {
    super(m.rows(), m.cols());
    this.m = m;

    this.blockRows = blockRows;
    this.blockCols = blockCols;

    this.startRow = startRow;
    this.startCol = startCol;
  }

  rows() {
    return this.blockRows;
  }

  cols() {
    return this.blockCols;
  }

  at(row, col) {
    return this.m.at(this.startRow + row, this.startCol + col);
  }

  set(row, col, val) {
    this.m.set(this.startRow + row, this.startCol + col, val);
  }
}

class AddMatrix extends ReadOnlyMatrix {
  constructor(protected left: IMatrix, protected right: IMatrix) {
    super(new ReadOnlyMatrix(this));

    this.left = left;
    this.right = right;
  }

  at(row, col) {
    return this.left.at(row, col) + this.right.at(row, col);
  }
}

class NeageteMatrix extends ReadOnlyMatrix {
  constructor(m) {
    super(m);
  }

  at(row, col) {
    return -this.m.at(row, col);
  }
}
