#!/usr/bin/env python3
# 长征2.0 融字图/场景图批量生成脚本 — youdiandou gpt-image-2.5-sunburst
# 剪纸版画风（风格圣经统一），中文融字。断点续跑：已存在文件跳过。
import os, base64, json, time, urllib.request, sys

KEY = os.environ.get("YOUDIANDOU_API_KEY")
if not KEY:
    print("无 YOUDIANDOU_API_KEY"); sys.exit(1)
OUT = "/home/sudong/projects/长征网页游戏2.0/assets/img"
os.makedirs(OUT, exist_ok=True)
for v in ("HTTPS_PROXY","HTTP_PROXY","ALL_PROXY","https_proxy","http_proxy"):
    os.environ.pop(v, None)

STYLE = ("剪纸版画风格儿童历史插画，贴合长征主题，配色红、土黄、赭石、墨绿，留白透气，"
         "构图主体居中偏下，儿童绘本感。画面中融入粗圆体宋体大字标题，中文大字清晰无错别字无漏字。")

IMAGES = [
 # (文件名, 场景内容, 融入文字)
 ("intro-0-fenghuo", "夜色中于都河渡口，红军小战士和工兵在月光下搭木头浮桥，河面泛月光，芦苇剪影", "烽火起程"),
 ("yudu-1-qiaiban", "河弯处工兵在白天把浮桥木板拆开藏到岸边芦苇里，河面微光", "昼拆夜搭浮桥"),
 ("wujiang-2-dujiang", "湍急乌江，两岸陡崖，红军侦察员在岸边观察水势，浪花翻涌", "看清水势再渡江"),
 ("zunyi-3-youdao", "遵义城楼前，红军战士围在摊开的地图边讨论路线，群山在远处", "密线是高山·山口是通道"),
 ("chishui-4-jizhi", "赤水河在山区蜿蜒成河湾，红军队伍在河边来回机动的路线示意", "声东击西·调虎离山"),
 ("jinshajiang-5-baidu", "金沙江峡谷，7只木船在江浪上按序摆渡，战士在船上有序站列", "7只小船·日夜摆渡"),
 ("ludingqiao-6-tiesuo", "大渡河深谷上一座铁索桥，13根铁链，战士在铺桥板向前", "13根铁索·稳稳向前"),
 ("jiajinshan-7-xueshan", "巍峨白雪夹金山，队伍结伴在雪坡上挖踏雪孔向上攀登", "上午9点到下午3点"),
 ("caodi-8-caodian", "高寒草地上零星草甸，战士一脚一脚踩草甸避开泥潭，互相搀扶", "看清草甸再下脚"),
 ("lazikou-9-yubi", "两山夹一沟的腊子口隘口，正面队伍牵制，侧面战士攀崖迂回", "正面牵制·侧崖迂回"),
 ("huishi-10-sanshi", "三路红军红旗在黄土高原会宁聚集，火炬点燃，队伍欢呼", "三路北上·会宁将台堡会师"),
]

def gen(file, scene, txt):
    out = os.path.join(OUT, file + ".png")
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        print("跳过(已存在):", file); return True
    prompt = f"{STYLE} 场景：{scene}。上方大字标题：『{txt}』。"
    body = {"model":"gpt-image-2.5-sunburst","prompt":prompt,"n":1}
    req = urllib.request.Request("http://api.youdiandou.store/v1/images/generations",
        data=json.dumps(body).encode(),
        headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=180)
        b64 = json.loads(r.read())["data"][0]["b64_json"]
        open(out,"wb").write(base64.b64decode(b64))
        print("生成:", file, os.path.getsize(out)); return True
    except Exception as e:
        print("失败:", file, repr(e)); return False

ok=fail=0
for file, scene, txt in IMAGES:
    if gen(file, scene, txt): ok+=1
    else: fail+=1
    time.sleep(2)
print(f"完成 {ok} 成功 / {fail} 失败")