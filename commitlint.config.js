module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type 枚举
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug 修复
        'docs',     // 文档更新
        'style',    // 代码格式（不影响功能）
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建/工具链变动
        'ci',       // CI/CD 配置
        'revert',   // 回滚
      ],
    ],
    // Subject 不能为空
    'subject-empty': [2, 'never'],
    // Subject 不能以句号结尾
    'subject-full-stop': [2, 'never', '.'],
    // Subject 必须小写开头
    'subject-case': [2, 'always', 'lower-case'],
    // Type 必须小写
    'type-case': [2, 'always', 'lower-case'],
    // Scope 必须小写
    'scope-case': [2, 'always', 'lower-case'],
    // Header 最大长度
    'header-max-length': [2, 'always', 100],
  },
};
