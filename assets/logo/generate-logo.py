"""Generate the original folded-L symbol and outlined wordmark.
Offline manual step; FontTools4.66.1, owned Inter Latin master/OFL.
Run from any directory with a Python environment containing FontTools.
No private font or external brand folder is read.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
import json,hashlib,subprocess
# Use real outline bounds to match the 11-16% symbol-height gap of approved masters.
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

def word_bounds(glyphs, positions):
    pen = BoundsPen(glyphs)
    for name, x, y in positions:
        glyphs[name].draw(TransformPen(pen, (1,0,0,1,x,y)))
    return pen.bounds

def word_position(bounds, scale, symbol, vertical=False, center=210):
    xmin,ymin,xmax,ymax=bounds
    left,top,right,bottom=symbol
    gap=(bottom-top)*0.132
    if vertical:
        return center-(xmin+xmax)*scale/2, bottom+gap+ymax*scale
    return right+gap-xmin*scale, 50+(ymin+ymax)*scale/2

root=Path(__file__).resolve().parents[2];dest=root/'assets/logo';pub=root/'apps/website/public/brand'
fontpath=root/'apps/website/src/assets/fonts/InterVariable-Latin.woff2'
f=instantiateVariableFont(TTFont(fontpath),{'wght':750,'opsz':32},inplace=False);gs=f.getGlyphSet();cmap=f.getBestCmap();paths=[];latinPos=[];x=0
for ch in 'Lumo UI':
 if ch==' ':x+=f['head'].unitsPerEm*.25;continue
 name=cmap[ord(ch)];p=SVGPathPen(gs);gs[name].draw(p);latinPos.append((name,x,0));paths.append(f'<path transform="translate({x} 0)" d="{p.getCommands()}"/>');x+=gs[name].width
scale=270/x
word=''.join(paths);latinBounds=word_bounds(gs,latinPos)
hx,hy=word_position(latinBounds,scale,(16*1.05,3,101.5*1.05,87*1.05+3))
vx,vy=word_position(latinBounds,scale,(16*1.2+145,6,101.5*1.2+145,87*1.2+6),True)
# Original folded L: open inner corner, sloped rising foot and detached light plane.
ink='M16 32Q16 28 20 26L39 15Q44 12 44 18V58L77 39Q81 36 85 39L98 47Q103 50 98 53L42 86Q38 88 34 86L20 78Q16 76 16 71Z'
lime='M52 20Q47 17 52 14L75 1Q79-1 83 1L99 10Q104 13 99 16L76 29Q72 32 68 29Z'
# Centre the mark in a100-square while preserving separation at favicon sizes.
def markbody(body):return f'<path fill="{body}" d="{ink}"/><path fill="#7fa828" d="{lime}"/>'
def svg(body,kind):
 if kind=='mark':return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" role="img" aria-label="Lumo UI"><g transform="translate(0 9)">{markbody(body)}</g></svg>\n'
 if kind=='horizontal':return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" role="img" aria-label="Lumo UI"><g transform="translate(0 3) scale(1.05)">{markbody(body)}</g><g fill="{body}" transform="translate({hx:.10f} {hy:.10f}) scale({scale:.10f} {-scale:.10f})">{word}</g></svg>\n'
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 220" role="img" aria-label="Lumo UI"><g transform="translate(145 6) scale(1.2)">{markbody(body)}</g><g fill="{body}" transform="translate({vx:.10f} {vy:.10f}) scale({scale:.10f} {-scale:.10f})">{word}</g></svg>\n'
for theme,body in [('paper','#101114'),('ink','#f2efe8')]:
 for kind,name in [('mark','lumo-mark'),('horizontal','lumo-lockup'),('vertical','lumo-lockup-vertical')]:
  value=svg(body,kind);(dest/f'{name}-on-{theme}.svg').write_text(value)
  if kind!='mark':(pub/f'{name}-on-{theme}.svg').write_text(value)
aware=svg('#101114','mark').replace('<g transform=', '<style>.body{fill:#101114}@media(prefers-color-scheme:dark){.body{fill:#f2efe8}}</style><g transform=',1).replace('fill="#101114"','class="body"')
(dest/'lumo-mark.svg').write_text(aware);(root/'apps/website/public/icon.svg').write_text(aware)
# Shape the full Persian name before outlining; joined glyphs and ZWNJ survive.
persianText='لومو یو‌آی'
faSource=dest/'source/Vazirmatn-Bold.ttf'
faFont=TTFont(faSource);faGlyphs=faFont.getGlyphSet()
shaped=json.loads(subprocess.run(['hb-shape',str(faSource),persianText,'--direction=rtl','--language=fa','--output-format=json'],check=True,capture_output=True,text=True).stdout)
assert all(g['g']!='.notdef' for g in shaped)
x=0;faPaths=[];faPos=[]
for g in shaped:
 pen=SVGPathPen(faGlyphs);faGlyphs[g['g']].draw(pen)
 faPos.append((g['g'],x+g['dx'],g['dy']))
 if pen.getCommands():faPaths.append(f'<path transform="translate({x+g["dx"]} {g["dy"]})" d="{pen.getCommands()}"/>')
 x+=g['ax']
faScale=270/x;faWord=''.join(faPaths);faBounds=word_bounds(faGlyphs,faPos)
for theme,body in [('paper','#101114'),('ink','#f2efe8')]:
 for kind,name in [('horizontal','lumo-lockup-fa'),('vertical','lumo-lockup-vertical-fa')]:
  original=svg(body,kind);old=f'<g fill="{body}" transform="translate({hx if kind=="horizontal" else vx:.10f} {hy if kind=="horizontal" else vy:.10f}) scale({scale:.10f} {-scale:.10f})">{word}</g>'
  fx,fy=word_position(faBounds,faScale,(16*1.05,3,101.5*1.05,87*1.05+3)) if kind=='horizontal' else word_position(faBounds,faScale,(16*1.2+145,6,101.5*1.2+145,87*1.2+6),True)
  new=f'<g fill="{body}" transform="translate({fx:.10f} {fy:.10f}) scale({faScale:.10f} {-faScale:.10f})">{faWord}</g>'
  value=original.replace(old,new).replace('aria-label="Lumo UI"',f'aria-label="{persianText}"');assert value!=original
  (dest/f'{name}-on-{theme}.svg').write_text(value);(pub/f'{name}-on-{theme}.svg').write_text(value)
proof={'at':'2026-10-12','originalSymbol':True,'symbolDesign':'Folded geometric L with open corner and detached rising lime plane; original paths, family direction from Telarsa and Khatamo, no copying their marks.','wordmark':{'text':'Lumo UI','outlined':True,'source':'Owned Inter Latin master OFL; no Reserved Font Name','sourceSha256':hashlib.sha256(fontpath.read_bytes()).hexdigest(),'wght':750,'opsz':32,'generator':'assets/logo/generate-logo.py'},'wordmarkFa':{'text':persianText,'outlined':True,'source':'assets/logo/source/Vazirmatn-Bold.ttf','sourceSha256':hashlib.sha256(faSource.read_bytes()).hexdigest(),'licence':'SIL OFL1.1; source/OFL-Vazirmatn.txt','shaper':'HarfBuzz, direction=rtl, language=fa','shaping':shaped},'gap':{'ratioToSymbolHeight':0.132,'reference':'Measured Telarsa11% and Khatamo15–16% horizontal/vertical outline gaps'},'paper':'#f2efe8','ink':'#101114','lime':'#7fa828','masters':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in dest.glob('*.svg')}}
(dest/'provenance.json').write_text(json.dumps(proof,indent=2)+'\n')
print('Original Lumo logo SVG masters + website variants generated, outlined Inter wordmark', len(paths),'glyphs')
