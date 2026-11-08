# -*- coding: utf-8 -*-
"""Выгрузка всех русских текстов игры (реплики, пузыри, подсказки, надписи) в docs/Реплики_игры.txt.
Для каждой строки: уровень, файл и номер строки, место в коде (сцена/класс/функция), кто говорит.
Запуск: py tools/export_lines.py"""
import os, re, glob, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, 'js')
OUT = os.path.join(ROOT, 'docs', 'Реплики_игры.txt')
CYR = re.compile(r'[А-Яа-яЁё]{2}')
SKIP = {'sprites_data.js', 'webp_list.js', 'sem3_data.js', 'sea3_layout.js', 'music.js', 'l10skin.js'}

LEVELS = {1: 'СЕВМОЛОТ', 2: 'ДОРОГА ДОМОЙ', 3: 'ГЛЮКИ', 4: 'ДИКИЕ КОШКИ', 5: 'ПОГОНЯ', 6: 'ГРИБНОЙ ДОЖДЬ',
          7: 'ЗАВОДОУПРАВЛЕНИЕ', 8: 'ЗАКУЛИСЬЕ', 9: 'ПОДЗЕМКА', 10: 'ФИНАЛ'}
OLD7 = {'level7.js', 'level7map.js', 'level7run.js', 'level7scenes.js', 'level7mg.js'}


def section(fn):
    if fn in OLD7: return (7.5, 'УРОВЕНЬ 7 — СТАРАЯ ВЕРСИЯ (в игре не используется, только тест-ссылки ?l7…)')
    m = re.match(r'(?:level|l)(\d+)', fn)
    if m:
        n = int(m.group(1)); return (n, 'УРОВЕНЬ %d «%s»' % (n, LEVELS.get(n, '')))
    if fn == 'extras.js': return (11, 'ЭНЦИКЛОПЕДИЯ И ФИНАЛЬНЫЕ ТИТРЫ')
    return (0, 'ОБЩЕЕ: меню, итоги, общие враги и подсказки')


# ---------- имена говорящих из WHO ----------
WHO = {}
for f in glob.glob(os.path.join(JS, '*.js')):
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r"(?:WHO\.|^\s*|[{,]\s*)(\w+)\s*[=:]\s*(?:WHO\.\w+\s*\|\|\s*)?\{\s*name:\s*'([^']+)'", s, re.M):
        WHO.setdefault(m.group(1), m.group(2))
WHO.setdefault('valera', 'ВАЛЕРА')

SAY_SCENE = {'Scene.say', 'say4', 'say'}           # (who, text, …)
SAY_BUBBLE = {'G.say'}                             # (над кем, текст, …)
SAY_HUD = {'lv.say', 'P.lv.say', 'this.say', 'this.stage.say', 'st.say', 'P.hintAt', 'hintAt', 'this.lv.say', 'r.say', 'stage.say', 'L.say'}
SAY_TV = {'xsay', 'P.lv.xsay', 'lv.xsay', 'this.xsay'}
PLAYER = re.compile(r'(^|\.)(player|pl|P|v|val|hero|valera|me)$')


def tokenize(src):
    """Строки-литералы с кириллицей + стек открытых скобок в момент литерала."""
    out = []
    i, n, line = 0, len(src), 1
    stack = []          # [ch, name, start, commas]
    prev_sig = ''       # последний значимый символ (для различения регэкспа)
    while i < n:
        ch = src[i]
        if ch == '\n': line += 1; i += 1; continue
        if src.startswith('//', i):
            j = src.find('\n', i); i = n if j < 0 else j; continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2); j = n if j < 0 else j + 2; line += src.count('\n', i, j); i = j; continue
        if ch == '/' and prev_sig in '(,=:[!&|?{};+-*%<>~^' :          # регэксп
            j = i + 1; cls = False
            while j < n and src[j] != '\n':
                if src[j] == '\\': j += 2; continue
                if src[j] == '[': cls = True
                elif src[j] == ']': cls = False
                elif src[j] == '/' and not cls: break
                j += 1
            i = j + 1; prev_sig = 'r'; continue
        if ch in '\'"`':
            q, j, buf, l0 = ch, i + 1, [], line
            while j < n and src[j] != q:
                if src[j] == '\\' and j + 1 < n:
                    buf.append({'n': '\n', 't': ' '}.get(src[j + 1], src[j + 1])); j += 2; continue
                if src[j] == '\n': line += 1
                buf.append(src[j]); j += 1
            text = ''.join(buf)
            if CYR.search(text):
                out.append({'text': text, 'line': l0, 'pos': i, 'stack': [list(x) for x in stack]})
            i = j + 1; prev_sig = 's'; continue
        if ch in '([{':
            k = i - 1
            while k >= 0 and src[k] in ' \t': k -= 1
            m = re.search(r'([\w$.]+)\s*$', src[max(0, k - 80):k + 1]) if ch == '(' else None
            name = m.group(1) if m else ''
            if ch in '[{':                 # имя массива/объекта: «X = [» или «key: [»
                m2 = re.search(r'([\w$.]+)\s*[=:]\s*$', src[max(0, i - 80):i])
                name = m2.group(1) if m2 else ''
            stack.append([ch, name, i, []])
        elif ch in ')]}':
            if stack: stack.pop()
        elif ch == ',' and stack:
            stack[-1][3].append(i)
        if not ch.isspace(): prev_sig = ch if not (ch.isalnum() or ch in '_$') else 'w'
        i += 1
    return out


def arg_text(src, fr, k):
    """k-й аргумент вызова (текст)."""
    _, _, start, commas = fr
    b = [start] + commas
    if k >= len(b): return ''
    e = b[k + 1] if k + 1 < len(b) else start + 200
    return src[b[k] + 1:e].strip()


def who_of(src, lit):
    st = lit['stack']
    # кортеж вида [время, 'кто', 'текст'] или f('кто', 'текст')
    if st:
        fr = st[-1]
        m = re.search(r"['\"](\w+)['\"]\s*,\s*$", src[fr[2]:lit['pos']])
        if m and m.group(1) in WHO: return WHO[m.group(1)]
    for fr in reversed(st):
        ch, name = fr[0], fr[1]
        if ch != '(': continue
        idx = sum(1 for c in fr[3] if c < lit['pos'])
        if name in SAY_SCENE or name.endswith('.say') and name not in SAY_HUD and name not in SAY_BUBBLE:
            a0 = arg_text(src, fr, 0)
            m = re.match(r"^['\"](\w+)['\"]$", a0)
            if m and idx >= 1: return WHO.get(m.group(1), m.group(1).upper())
            if name in SAY_HUD or name.endswith('.say'): return 'НАДПИСЬ НА ЭКРАНЕ'
        if name == 'talk':
            a1 = arg_text(src, fr, 1); m = re.match(r"^['\"](\w+)['\"]$", a1)
            if m: return WHO.get(m.group(1), m.group(1).upper())
        if name in SAY_BUBBLE:
            a0 = arg_text(src, fr, 0)
            if PLAYER.search(a0): return 'ВАЛЕРА (пузырь)'
            return 'ПУЗЫРЬ над «%s»' % a0
        if name in SAY_HUD: return 'НАДПИСЬ / ПОДСКАЗКА'
        if name in SAY_TV: return 'ГОСПОДИН ИКС (на экране)'
        if name in ('shout',): return 'ТОЛПА'
    for fr in reversed(st):
        if fr[0] in '[{' and fr[1]:
            nm = fr[1].split('.')[-1]
            if re.search(r'LINES|TAUNT|lines|PHRASE', fr[1]) or nm in WHO or re.match(r'^[a-z]\w*$', nm) and any(re.search(r'LINES|TAUNT|lines', x[1]) for x in st):
                return 'СЛУЧАЙНЫЕ ФРАЗЫ: ' + (WHO.get(nm) or nm)
    # поле объекта: «hint: '…'», «bio: '…'»
    m = re.search(r'([\w$]+)\s*:\s*$', src[max(0, lit['pos'] - 40):lit['pos']])
    if m: return KEYS.get(m.group(1), 'ПОЛЕ «%s»' % m.group(1))
    # ближайший вызов, в котором стоит строка
    for fr in reversed(st):
        if fr[0] == '(' and fr[1]:
            nm = fr[1]
            if nm in CALLS: return CALLS[nm]
            if re.match(r'^(S|X8|X9|X10|AN|P|X)$', nm): return 'ЭНЦИКЛОПЕДИЯ: название анимации'
            if nm in ('row', 'h', 'sub'): return 'ТИТРЫ'
            if nm.endswith('text') or nm.endswith('Text'): return 'НАДПИСЬ НА ЭКРАНЕ'
            if nm in ('U.choice', 'choice', 'push', 'concat', 'join', 'map', 'filter', 'forEach', 'Math.max', 'Math.min'): continue
            return 'ТЕКСТ НА ЭКРАНЕ (через %s)' % nm
    return 'ТЕКСТ (меню/интерфейс/прочее)'


KEYS = {'bio': 'ЭНЦИКЛОПЕДИЯ: описание', 'moves': 'ЭНЦИКЛОПЕДИЯ: приёмы/умения', 'weak': 'ЭНЦИКЛОПЕДИЯ: слабость',
        'name': 'ИМЯ / НАЗВАНИЕ', 'sub': 'ПОДЗАГОЛОВОК', 'line': 'РЕПЛИКА', 'lines': 'РЕПЛИКИ', 'hint': 'ПОДСКАЗКА', 'text': 'ТЕКСТ',
        'label': 'НАДПИСЬ', 'deathText': 'НАДПИСЬ ПРИ СМЕРТИ', 'title': 'ЗАГОЛОВОК', 'msg': 'НАДПИСЬ', 'say': 'РЕПЛИКА', 'cap': 'ПОДПИСЬ',
        'tag': 'МЕТКА', 'n': 'НАЗВАНИЕ', 's': 'ТИТРЫ'}
CALLS = {'G.text': 'НАДПИСЬ НА ЭКРАНЕ', 'G.banner': 'БАННЕР НА ЭКРАНЕ', 'banner': 'БАННЕР НА ЭКРАНЕ', 'Scene.title': 'ЗАГОЛОВОК СЦЕНЫ',
         'Scene.caption': 'ПОДПИСЬ В СЦЕНЕ', 'caption': 'ПОДПИСЬ В СЦЕНЕ', 'G.float': 'ВСПЛЫВАЮЩАЯ НАДПИСЬ', 'FX.text': 'ВСПЛЫВАЮЩАЯ НАДПИСЬ',
         'it.push': 'ПУНКТ МЕНЮ', 'L3.comic': 'КОМИКС-КАДР'}


MARK_FN = re.compile(r"^\s*(?:(?:const|let|var)\s+)?([\w$.]+)\s*=\s*(?:async\s+)?function\s*\*?|^\s*(?:async\s+)?function\s*\*?\s*(\w+)|^\s*([\w$]+)\s*:\s*function\s*\*?|^\s*(?:static\s+)?\*?\s*(\w+)\s*\([^)]*\)\s*\{\s*$")
MARK_CLS = re.compile(r"^\s*(?:class\s+(\w+)|([\w$.]+)\s*=\s*class\b)")
MARK_HEAD = re.compile(r"^\s*//\s*[-=]{3,}\s*(.+?)\s*[-=]*\s*$")
KW = {'if', 'for', 'while', 'switch', 'catch', 'function', 'return'}


def contexts(src):
    """Для каждой строки файла — подпись места: заголовок-комментарий › класс › функция/сцена."""
    res, head, cls, fn = [], '', '', ''
    for ln in src.split('\n'):
        m = MARK_HEAD.match(ln)
        if m: head = m.group(1).strip(' -=')
        m = MARK_CLS.match(ln)
        if m: cls = m.group(1) or m.group(2); fn = ''
        m = MARK_FN.match(ln)
        if m:
            name = next(g for g in m.groups() if g)
            if name not in KW: fn = name
        res.append(' › '.join(x for x in (head, cls, fn) if x))
    return res


def main():
    groups = {}
    total = 0
    for f in sorted(glob.glob(os.path.join(JS, '*.js'))):
        fn = os.path.basename(f)
        if fn in SKIP: continue
        src = open(f, encoding='utf-8').read()
        ctx = contexts(src)
        lits = tokenize(src)
        rows = []
        for lit in lits:
            before = src[max(0, lit['pos'] - 12):lit['pos']]
            if re.search(r'name:\s*$', before) and fn != 'extras.js': continue      # имена в таблицах говорящих
            who = who_of(src, lit)
            if who == 'ПУЗЫРЬ над «this»':
                cls = [p for p in ctx[lit['line'] - 1].split(' › ')]
                who = 'ПУЗЫРЬ над врагом/персонажем (%s)' % (cls[-2] if len(cls) > 1 else cls[0] or 'объект')
            rows.append((lit['line'], ctx[lit['line'] - 1], who, lit['text']))
        if rows:
            key = section(fn)
            groups.setdefault(key, []).append((fn, rows)); total += len(rows)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8-sig', newline='\r\n') as o:
        o.write('ВАЛЕРА: АГЕНТ RED — ВСЕ ТЕКСТЫ ИГРЫ\n')
        o.write('Собрано автоматически из кода (tools/export_lines.py). Строк: %d.\n' % total)
        o.write('Формат: [номер строки в файле]  КТО ГОВОРИТ: текст\n')
        o.write('«Место» — сцена/класс/функция в коде, где звучит реплика.\n')
        o.write('Как править: исправь текст прямо в этом файле и пришли его обратно — по файлу и номеру строки правка переносится в игру.\n')
        o.write('{jump}, {punch}, {down} и т.п. — подставляются названия кнопок; ${...} — подставляемые значения.\n\n')
        for key in sorted(groups):
            o.write('=' * 78 + '\n' + key[1] + '\n' + '=' * 78 + '\n\n')
            for fn, rows in groups[key]:
                o.write('--- файл js/%s ---\n' % fn)
                last = None
                for line, c, who, text in rows:
                    if c != last:
                        o.write('\n  Место: %s\n' % (c or 'начало файла')); last = c
                    o.write('    [%d]  %s: %s\n' % (line, who, ' '.join(text.split())))
                o.write('\n')
    print('ok', total, OUT)


if __name__ == '__main__':
    main()
