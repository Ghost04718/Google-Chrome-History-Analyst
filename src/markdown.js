export function renderMarkdown(text) {
    const marked = {
      heading: (text, level) => `<h${level}>${text}</h${level}>`,
      paragraph: text => `<p>${text}</p>`,
      list: (text) => `<ul>${text}</ul>`,
      listitem: text => `<li>${text}</li>`,
      strong: text => `<strong>${text}</strong>`,
      em: text => `<em>${text}</em>`,
      codespan: text => `<code>${text}</code>`,
      br: () => '<br/>',
    };
  
    const rules = {
      heading: /^(#{1,6})\s+(.*)/gm,
      paragraph: /^(?!#|-)(.+)(?:\n|$)/gm,
      list: /^-\s+(.+)(?:\n|$)/gm,
      strong: /\*\*(.*?)\*\*/g,
      em: /\*(.*?)\*/g,
      codespan: /`(.*?)`/g,
      br: /\n/g,
    };
  
    let html = text;
  
    // 应用规则
    Object.entries(rules).forEach(([type, regex]) => {
      html = html.replace(regex, (...args) => {
        if (type === 'heading') {
          const level = args[1].length;
          return marked.heading(args[2], level);
        }
        if (type === 'list') {
          const items = args[0].split('\n')
            .filter(item => item.trim())
            .map(item => marked.listitem(item.replace(/^-\s+/, '')))
            .join('');
          return marked.list(items);
        }
        if (type === 'br') {
          return marked.br();
        }
        return marked[type](args[1]);
      });
    });
  
    return html;
  }