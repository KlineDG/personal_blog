import { Node, mergeAttributes } from '@tiptap/core';


export type Align = 'left' | 'center' | 'right';


declare module '@tiptap/core' {
interface Commands<ReturnType> {
figure: {
setFigure: (attrs: { src: string; alt?: string; caption?: string; align?: Align }) => ReturnType;
setFigureAlign: (align: Align) => ReturnType;
setFigureCaption: (caption: string) => ReturnType;
}
}
}


export const FigureExtension = Node.create({
name: 'figure',
group: 'block',
atom: true,
draggable: true,


addAttributes() {
return {
src: { default: '' },
alt: { default: '' },
caption: { default: '' },
align: { default: 'center' as Align },
};
},


parseHTML() {
return [
{
tag: 'figure[data-type="figure"]',
},
];
},


renderHTML({ HTMLAttributes }) {
const { src, alt, caption, align } = HTMLAttributes as any;
return [
'figure',
mergeAttributes({ 'data-type': 'figure', class: `align-${align}` }),
['img', { src, alt }],
caption ? ['figcaption', {}, caption] : ['figcaption']
];
},


addCommands() {
return {
setFigure:
(attrs) => ({ commands }) =>
commands.insertContent({ type: this.name, attrs }),
setFigureAlign:
(align) => ({ state, commands }) => {
const { from, to } = state.selection;
let updated = false;
state.doc.nodesBetween(from, to, (node, pos) => {
if (node.type.name === this.name) {
updated = true;
commands.updateAttributes(this.name, { align });
return false;
}
return undefined;
});
return updated;
},
setFigureCaption:
(caption) => ({ commands }) => commands.updateAttributes(this.name, { caption }),
};
},
});