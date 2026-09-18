/*这里写ai agent的交付词和过程中ai自己思考出来的关键转折点，中英文都可直接在下面添加即可，不用添加日期和姓名，尽量加就可以，主要用于留痕学习*/
Please refactor the "章节小测" (Chapter Quiz) section on the current page into a collapsible accordion component. 

Requirements:
1. Keep the quiz in the same place on the current page instead of moving it to a new route.
2. Wrap the quiz inside a toggleable container (Collapsible/Accordion) so it does not make the page overly long.
3. The header should display the title "章节小测", status (e.g., "未完成"), and an expand/collapse arrow icon.
4. By default, keep it collapsed (or expanded with a clear toggle button).
5. Add smooth CSS open/close transitions.
6. Ensure existing quiz logic, radio buttons, and score calculation are preserved without breaking.

req： 参考beat章节的分页面方式，把chords章节按照h1位置作为子项，创建新的chords-xx.html页面，然后分隔原chords.html的内容，保留主要页面样式，并以文本为蓝图同步更改目录。
刚才的原页收缩补丁因为工具参数缺少说明字段，没有写入文件；工作区没有被部分修改。用同一组变更重新提交，并继续保持只删除原页中已经迁移的三个 h1 单元。
回归结果很有价值：四个新页面均能正常加载，失败集中在两类可定位问题：测试仍把听辨练习固定加载到旧入口，而它现在位于 chords-intervals.html；另外静态检查报告的图片缺失是仓库原有资源命名/缺失问题，但新和弦页确实沿用了其中一个资源引用。先修正测试入口，并核对图片目录后再跑一次，避免把旧测试假设误当成实现回归。
以后有关静态测试的，如果是jpg、png、mp3、wav、svg、aiff、ttf、woff等多媒体和外资源文件就不用继续回归了，其他文件请在相应位置新建相应文件，填充基础内容并作注释，不用写新的md文件。
