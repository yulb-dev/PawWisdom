module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type 枚举
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // Bug 修复
        'docs', // 文档更新
        'style', // 代码格式（不影响功能）
        'refactor', // 重构
        'perf', // 性能优化
        'test', // 测试相关
        'chore', // 构建/工具链变动
        'ci', // CI/CD 配置
        'revert', // 回滚
        'release' // 发布
      ]
    ],
    // Subject 不能为空
    'subject-empty': [2, 'never'],
    // Subject 不能以句号或。结尾
    'subject-full-stop': [2, 'never', '.。'],
    // Subject 禁用大小写检查（兼容中文）
    'subject-case': [0],
    // Type 必须小写
    'type-case': [2, 'always', 'lower-case'],
    // Scope 必须小写
    'scope-case': [2, 'always', 'lower-case'],
    // Header 最大长度
    'header-max-length': [2, 'always', 100],
    // Subject 优先使用中文（警告级别）
    'subject-chinese': [1, 'always']
  },
  plugins: [
    {
      rules: {
        'subject-chinese': ({ subject }) => {
          // 检查 subject 是否包含中文字符
          const chineseRegex = /[\u4e00-\u9fa5]/
          if (!subject || !chineseRegex.test(subject)) {
            return [
              false,
              '建议使用中文描述提交内容，以提高团队协作效率。\n' +
                '示例：\n' +
                '  👍 推荐：feat(pet): 添加宠物情绪识别功能\n' +
                '  👍 推荐：fix(auth): 修复登录令牌验证问题\n' +
                '  ⚠️  可接受：feat(pet): add pet emotion detection'
            ]
          }
          return [true]
        }
      }
    }
  ]
}
