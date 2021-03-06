# linalg.js

This is simple javascript linear algebra library that can do many awesome things. Idea is to mimic [Eigen](http://eigen.tuxfamily.org)'s behaviour and it's lazy evaluation.

See:
 
 <http://eigen.tuxfamily.org/dox/TopicLazyEvaluation.html>
 
 <http://eigen.tuxfamily.org/dox/TopicInsideEigenExample.html>

 <http://eigen.tuxfamily.org/dox/group__DenseMatrixManipulation__chapter.html>

 <http://eigen.tuxfamily.org/dox/AsciiQuickReference.txt>

####Implemented features:
 - data mapping (use offsets, inner and outer stripe)
 - lazy evaluation of operations like transpose, block, row/col, add/subtract, negate
 - copy on write (copy underlying data only when it's being modified)
 
####Yet to be implemented features: 
 - reductions (rowwise/colwise, max/min, prod, sum, trace, all, any)
 - iterations
 - matrix decompositions (LU, SVD, QR, RQ)
 - geometry (planes, lines)


### Matrix interface is defined like this:

__Methods:__
 - at(row: Integer, col: Integer)
 - set(row: Integer, col: Integer, val: DataType)
 - copy()
 
__Properties:__
 - rows: Integer
 - cols: Integer
 
 
###  List of operations by time complexity:
 - transpose, block, row, col, asDiagonal, diagonal, triangular views
 - add, subtract, negate, abs, sqrt, 
 - element-wise multiplication/division
 - matrix-multiplication, rowwise, colwise
 - inverse, SVD, ...

### Eigen's class hieararchy
```
 MatrixBase
	|
	+---Matrix
	|
	+---CwiseBinaryOp
	|  +--cwiseEqual
	|  +--cwiseMax
	|  +--cwiseMin
	|  +--cwiseNotEqual
	|  +--cwiseProduct
	|  +--cwiseQuotient
	|  +--minus
	|  +--plus
	|  +--multiplication
	|
	+--+-CwiseUnaryOp
	|  +--cwiseAbs
	|  +--cwiseAbs2
	|  +--cwiseEqual
	|  +--cwiseInverse
	|  +--cwiseSqrt
	|  +--scalar-multiplication
	|  +--scalar-division
	|  +--scalar-addition
	|  +--scalar-subtraction
	|  +--scalar-clamp
	|
	+--+-CwiseNullaryOp
	   +--Ones
	   +--Zero
	   +--Random
	   +--Identity
	   +--Constant
```
	
	
