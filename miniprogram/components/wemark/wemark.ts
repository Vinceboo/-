Component({
  properties: {
    md: {
      type: String,
      value: '',
      observer() {
        this.parseMd();
      }
    },
    type: {
      type: String,
      value: 'wemark'
    }
  },

  data: {
    parsedContent: []
  },

  methods: {
    parseMd() {
      if (!this.data.md) {
        this.setData({ parsedContent: [] });
        return;
      }

      const lines = this.data.md.split('\n');
      const parsedContent = lines.map(line => {
        // 处理图片 ![alt](url)
        const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (imageMatch) {
          return {
            type: 'image',
            alt: imageMatch[1],
            src: imageMatch[2]
          };
        }

        // 处理标题
        if (line.startsWith('#')) {
          const level = line.match(/^#+/)[0].length;
          return {
            type: 'heading',
            level,
            content: line.replace(/^#+\s*/, '')
          };
        }
        // 处理列表
        if (line.startsWith('- ')) {
          return {
            type: 'list-item',
            content: line.slice(2)
          };
        }
        // 处理粗体
        if (line.includes('**')) {
          return {
            type: 'bold',
            content: line.replace(/\*\*/g, '')
          };
        }
        // 普通文本
        return {
          type: 'text',
          content: line
        };
      });

      this.setData({ parsedContent });
    },

    // 添加图片预览功能
    previewImage(e: any) {
      const src = e.currentTarget.dataset.src;
      wx.previewImage({
        current: src,
        urls: [src]
      });
    }
  }
}); 