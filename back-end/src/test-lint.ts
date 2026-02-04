// 测试文件 - 故意包含一些 lint 问题

export class TestClass {
  private unusedVariable = 'test';  // 未使用的变量
  
  testMethod( ) {  // 多余的空格
    const x=1+2;  // 缺少空格
    console.log( x )  // 不规范的空格，缺少分号
  }
}
