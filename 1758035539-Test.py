import requests
import urllib3
import json
import base64
import time
import re
import random
import os
from enum import Enum

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class FacebookReaction(Enum):
    LIKE = "1635855486666999"
    LOVE = "1678524932434102"
    CARE = "613557422527858"
    HAHA = "115940658764963"
    WOW = "478547315650144"
    SAD = "908563459236466"
    ANGER = "444813342392137"
    CANCEL = "0"

class FacebookAutoReaction:
    def __init__(self, Cookie, CacheFile="fb_tokens.json"):
        self.Cookie = Cookie
        self.Session = requests.Session()
        self.Session.verify = False
        self.CacheFile = CacheFile
        
        self.UserId = None
        self.Jazoest = None
        self.LsdToken = None
        self.DtsgToken = None
        
        self.BaseHeaders = {
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            'sec-ch-ua': "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
            'sec-ch-ua-mobile': "?0",
            'sec-ch-ua-platform': "\"Windows\"",
            'sec-ch-ua-platform-version': "\"19.0.0\"",
            'sec-ch-ua-model': "\"\"",
            'sec-ch-ua-full-version-list': "\"Not)A;Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"138.0.7204.97\", \"Google Chrome\";v=\"138.0.7204.97\"",
            'sec-ch-prefers-color-scheme': "dark",
            'accept-language': "vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6",
            'Cookie': self.Cookie
        }
        
        print("🔄 BƯỚC 1: Kiểm tra token từ bộ nhớ đệm...")
        if self.LoadCachedTokens():
            print("✅ Đã tải token từ bộ nhớ đệm")
        else:
            print("🔄 Lấy token mới từ Facebook...")
            self.GetTokens()
            self.SaveTokensToCache()
    
    def LoadCachedTokens(self):
        try:
            if os.path.exists(self.CacheFile):
                with open(self.CacheFile, 'r') as f:
                    cache = json.load(f)
                    self.UserId = cache.get('user_id')
                    self.Jazoest = cache.get('jazoest')
                    self.LsdToken = cache.get('lsd_token')
                    self.DtsgToken = cache.get('dtsg_token')
                    if all([self.UserId, self.Jazoest, self.LsdToken, self.DtsgToken]):
                        return True
            return False
        except Exception as e:
            print(f"❌ Lỗi khi tải token từ bộ nhớ đệm: {e}")
            return False
    
    def SaveTokensToCache(self):
        try:
            cache = {
                'user_id': self.UserId,
                'jazoest': self.Jazoest,
                'lsd_token': self.LsdToken,
                'dtsg_token': self.DtsgToken
            }
            with open(self.CacheFile, 'w') as f:
                json.dump(cache, f)
            print("✅ Đã lưu token vào bộ nhớ đệm")
        except Exception as e:
            print(f"❌ Lỗi khi lưu token vào bộ nhớ đệm: {e}")
    
    def GetTokens(self):
        try:
            c_user_match = re.search(r'c_user=(\d+)', self.Cookie)
            if c_user_match:
                self.UserId = c_user_match.group(1)
                print(f"✅ ID người dùng: {self.UserId}")
            else:
                raise Exception("Không tìm thấy c_user trong cookie")
            
            url = "https://www.facebook.com"
            Headers = self.BaseHeaders.copy()
            Headers.update({
                'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                'dpr': "1",
                'viewport-width': "1920",
                'upgrade-insecure-requests': "1",
                'sec-fetch-site': "none",
                'sec-fetch-mode': "navigate",
                'sec-fetch-user': "?1",
                'sec-fetch-dest': "document",
                'priority': "u=0, i"
            })

            response = requests.get(url, headers=Headers, verify=False)
            HtmlContent = response.text
            
            print(f"   Độ dài phản hồi: {len(HtmlContent)}")
            
            self.Jazoest = re.search(r"jazoest=(\d+)", HtmlContent).group(1)
            self.LsdToken = re.search(r'"token":"([^"]+)"},323\]', HtmlContent).group(1)
            DtsgMatch = re.search(r'"dtsg":{"token":"([^"]+)"', HtmlContent)
            
            if not DtsgMatch:
                raise Exception("Không tìm thấy dtsg_token")
            
            self.DtsgToken = DtsgMatch.group(1)
            
            print(f"✅ Token OK - Jazoest: {self.Jazoest}, LSD: {self.LsdToken[:10]}..., DTSG: {self.DtsgToken[:10]}...")
            
        except Exception as e:
            print(f"❌ Lỗi khi lấy token: {e}")
            raise
    
    def GetNewsFeedPosts(self):
        print("\n🔄 BƯỚC 2: Lấy bài viết từ News Feed...")
        
        Variables = {
            "RELAY_INCREMENTAL_DELIVERY": True,
            "clientQueryId": "7cfd71a6-89d4-49a9-b5b3-7a3ec2b2b4c6",
            "clientSession": None,
            "connectionClass": "GOOD",
            "count": 10,
            "cursor": "",
            "experimentalValues": None,
            "feedLocation": "NEWSFEED",
            "feedStyle": "DEFAULT",
            "feedbackSource": 1,
            "focusCommentID": None,
            "orderby": ["TOP_STORIES"],
            "privacySelectorRenderLocation": "COMET_STREAM",
            "refreshMode": "COLD_START",
            "renderLocation": "homepage_stream",
            "scale": 1,
            "shouldChangeBRSLabelFieldName": False,
            "shouldChangeSponsoredAuctionDistanceFieldName": False,
            "shouldChangeSponsoredDataFieldName": False,
            "shouldObfuscateCategoryField": False,
            "useDefaultActor": False,
            "__relay_internal__pv__GHLShouldChangeSponsoredAuctionDistanceFieldNamerelayprovider": False,
            "__relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider": False,
            "__relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider": False,
            "__relay_internal__pv__IsWorkUserrelayprovider": False,
            "__relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider": True,
            "__relay_internal__pv__FeedDeepDiveTopicPillThreadViewEnabledrelayprovider": False,
            "__relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider": False,
            "__relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider": False,
            "__relay_internal__pv__IsMergQAPollsrelayprovider": False,
            "__relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider": True,
            "__relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider": False,
            "__relay_internal__pv__CometUFIShareActionMigrationrelayprovider": True,
            "__relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider": False,
            "__relay_internal__pv__StoriesArmadilloReplyEnabledrelayprovider": True,
            "__relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider": True
        }
        
        Payload = {
            'av': self.UserId,
            '__aaid': "0",
            '__user': self.UserId,
            '__a': "1",
            '__req': "98",
            'dpr': "1",
            '__ccg': "GOOD",
            '__rev': "1024608489",
            '__comet_req': "15",
            'fb_dtsg': self.DtsgToken,
            'jazoest': self.Jazoest,
            'lsd': self.LsdToken,
            '__spin_r': "1024608489",
            '__spin_b': "trunk",
            '__crn': "comet.fbweb.CometHomeRoute",
            'fb_api_caller_class': "RelayModern",
            'fb_api_req_friendly_name': "CometNewsFeedPaginationQuery",
            'variables': json.dumps(Variables),
            'server_timestamps': "true",
            'doc_id': "24488967877354300"
        }
        
        Headers = self.BaseHeaders.copy()
        Headers.update({
            'x-fb-friendly-name': "CometNewsFeedPaginationQuery",
            'x-asbd-id': "359341",
            'x-fb-lsd': self.LsdToken,
            'content-type': "application/x-www-form-urlencoded",
            'origin': "https://www.facebook.com",
            'sec-fetch-site': "same-origin",
            'sec-fetch-mode': "cors",
            'sec-fetch-dest': "empty",
            'referer': "https://www.facebook.com",
            'priority': "u=1, i"
        })
        
        response = self.Session.post("https://www.facebook.com/api/graphql/", data=Payload, headers=Headers)
        
        print(f"   Độ dài phản hồi News Feed: {len(response.text)}")
        
        return self.ExtractPostIds(response.text)
    
    def ExtractPostIds(self, ResponseText):
        PostIds = []
        SeenIds = set()
        
        def SearchRecursive(obj, depth=0):
            if depth > 15:
                return
                
            if isinstance(obj, dict):
                if "post_id" in obj:
                    post_id = obj["post_id"]
                    if post_id and post_id not in SeenIds:
                        SeenIds.add(post_id)
                        
                        actors = obj.get("actors", [])
                        UserName = "Không xác định"
                        UserId = ""
                        for actor in actors:
                            if isinstance(actor, dict) and actor.get("__typename") == "User":
                                UserName = actor.get("name", "Không xác định")
                                UserId = actor.get("id", "")
                                break
                        
                        PostIds.append({
                            "post_id": post_id,
                            "user_name": UserName.replace("\\", ""),
                            "user_id": UserId
                        })
                
                for value in obj.values():
                    if value is not None:
                        SearchRecursive(value, depth + 1)
                    
            elif isinstance(obj, list):
                for item in obj:
                    if item is not None:
                        SearchRecursive(item, depth + 1)
        
        lines = ResponseText.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                SearchRecursive(data)
            except json.JSONDecodeError:
                continue
        
        print(f"✅ Tìm thấy {len(PostIds)} bài viết")
        return PostIds
    
    def ReactToPost(self, PostId, Reaction=FacebookReaction.LIKE):
        Headers = self.BaseHeaders.copy()
        Headers.update({
            'x-fb-friendly-name': "CometUFIFeedbackReactMutation",
            'x-asbd-id': "129477",
            'x-fb-lsd': self.LsdToken,
            'content-type': "application/x-www-form-urlencoded",
            'origin': "https://www.facebook.com",
            'sec-fetch-site': "same-origin",
            'sec-fetch-mode': "cors",
            'sec-fetch-dest': "empty",
            'referer': "https://www.facebook.com",
            'accept': "*/*",
            'priority': "u=1, i"
        })
        
        ReactionValue = Reaction.value if isinstance(Reaction, FacebookReaction) else FacebookReaction[Reaction].value
        
        Data = {
            "av": self.UserId,
            "__aaid": "0",
            "__user": self.UserId,
            "__a": "1",
            "__req": "1x",
            "__hs": "20100.HYP:comet_pkg.2.1.0.2.1",
            "dpr": "1",
            "__ccg": "GOOD",
            "__rev": "1019282004",
            "__s": "gskg1a:3kg8qr:439uj4",
            "__hsi": "7458996942552697910",
            "__dyn": "7xeXzWK2l2u7Ung569yaxG4Qih0noeEb8nwgUaofVUKbgS3qi7UK360CEboG4E762S1DwUx60xU8E5O0BU2_CxS320qa321Rwwwg8a8462mcw8a1TwgEcEhwGxu782lwj8bU9kbxS2617wc61awkovwRwlE-U2exi4UaEW4UmwkUtxGm2SU4i5oe8cEW4-5pUfEe88o4qum7-2K0-obXCwLyESE2KwwwOg2cwMwhA4UjyUaUbGxe6Uak0zU8oC1hxB0qo4e16wWzUfHDzUiwRK6E4-mEbUaUaE2Txq",
            "__csr": "gdk5lNs9gV9kIIz5iHT6REjRsKDliih7vNIPiRqTAFliLqi9dYPJdGuLYOGFKoF6QAZt9GhaSrtV4ury8Pnup2yi5VGKmKiEGgyyaAUFmUyiuqJbKKfWHCGijjzlJdqmXApk-8VaWKtqDCHDyELy48h8KbDRx1oyq698C4F8iKvyoKbG7UiXxz-cCxyUOaJ3UjyoO4qm698iK1gy8S8gFoC48Kq4GxaagO46588Ukx2i3mUgx64Q5UWUJomxmqi5UOibwgecCoggqxuawIwl8lAwRUV0gpA48tBG2-VEOi19xq6qVqyEapp-2Sawq8swhEfU_w87ge8c89oswEyGoc85K2KmvS2a2lxu18g5aEG311J0xBpoaeh0royrwb612wQyooyo42ba9GDHoaEpgg89y8nxPwG22wyjjF28ViMxV69A85ezXZmyk1hy8nwsU8ESaAU6fwOEKi4U2Hwu410wgo4u2a1dwOm14wvUjwhogVEtb8l2p61WAzHzAju260wCjxm7FE5e-2W8wIg1vUkUG6EGU-bF0nEgxa0yoS68K02H60Oo12EC5U0jWV81ZE3cw0Ggw25EW12w0sxO4Lw0O2w0ytDy4bIE0EG0eLxm6F8C0iy1Wwmo5G0G82AyUK1Tw4yw69wIwcl0po31xpw5HBt05Bw2KE1C46FE88aQ9xe3y028G11xm0HE7O1Nwse5FHw2p88E3OwcO0xGwSg0gL80O80aI86CHw178yG05Ko5-0fL8dw0zww59w9y1cw5Dw",
            "__comet_req": "15",
            "fb_dtsg": self.DtsgToken,
            "jazoest": self.Jazoest,
            "lsd": self.LsdToken,
            "__spin_r": "1019282004",
            "__spin_b": "trunk",
            "__spin_t": "1736683059",
            "fb_api_caller_class": "RelayModern",
            "fb_api_req_friendly_name": "CometUFIFeedbackReactMutation",
            "variables": json.dumps({
                "input": {
                    "attribution_id_v2": "CometSinglePostDialogRoot.react,comet.post.single_dialog,via_cold_start,1736683061456,270454,,,",
                    "feedback_id": base64.b64encode(f"feedback:{PostId}".encode()).decode(),
                    "feedback_reaction_id": ReactionValue,
                    "feedback_source": "OBJECT",
                    "is_tracking_encrypted": True,
                    "tracking": ["AZX-62ianR8FB8zInCGS4_-RdPbGtFBd1OnI0gSGBQnld1d8JUP-h3VHiyCup_Uxg-Wjx1tIqW6ZKnfy4RLuXIVmOFsy2gazdVfq5kPtYU4OY6gz3OOGSJMSuwwjZe8uqgeaJLzn8KH4L3CmcS8Q98aVB3F_zk9g7KzbIzwHmlFmEwe159iaIPiwljUpzX3HQt-ctxw-LUKX0s6AepD-Uyt1aqPG5y4VLXNEB4eXIZUu_1zNa68nCbbKNkjRtLSht0EZ_04LiW3tQXg2bmP_d96tICZ1Q4-a1DU5wZlylrqBuUf0Rmt6tZjqVQdVrU5BFkeKVtk1s-0L2ifGXzNYdcA8T9Msit1dyUBchfFaCIT6tXqr7PkVhcEoheFCmH2sccJl9YIxtXaNUE7kODoweqW-wikkL6MBTqyobMpal1AyKJmB0E0txe4TQyUu-enC6IKFTojT5m_UcuxX7iC8mgjm2xMlI_G7dMRp55c7CjvJU_e9Ba3HqwDmzPGn-TBDGW9SnE2JOJ7TSRJePf0XV6w34bhpIzyOy-8E5BpSFUjY2HrF9H2FVsWeNV7M8qbGBXnLOb7JFWqL0cgNuUn055DZnzsU733OPi3NwsCpX1DxV6NiExaxC7buiz4YVMsnqjIoKvFLf5d5r3QQ0jWeOFdWjnkxoPvEDe10GKYPGIOID6l9YG4tb16imlgcgfCG4QMDzaPJO0LwbbLBnbfT9TTiawNGXZMuqOXodOgn8SbWccRXyNrh5GZ3J0G7kxOqffEgTjzPDI1BNs7SPCDOkkp-zWrBUcLPR9JTrJE-IgRUcPOop4mwuHEi2Bx1l6K5G_HNknvRFa4jQ4Mkbdwi2RmJzeJK7KLzK4JZUjZj5CujpACaDPsWVuQ3vaCHpT2o--l_CPIXkyQe9dAoY_cWs-suvomlzGZtPyshpnJJ0M-fSYr1Gy2PMcQ0u1fCYXf3-cJsdia8c7NUb4NnyHmwy_mNaiUiXAMBnzkFBV8jaw1fQTt8HpMujzhaIpft3XkGL2s2pzWEgIAw0BJeMMaoQFaaU0EN6mMl2WmgKDK_IO2tSeGZ-WoGLlcM1PWuDSmk1D5i-MxNq2T4hs1CY_jTnB4Z--SmXHjFST_T1Jo7lgzZNaCGDTIFQ0H2lsfFzfVuO8U"],
                    "session_id": "b789889b-9c3a-4aa5-8afe-b8ec0fcf642f",
                    "downstream_share_session_id": "2cba3094-3eed-4620-b450-176d57ebe012",
                    "downstream_share_session_origin_uri": "",
                    "downstream_share_session_start_time": "1736671802996",
                    "actor_id": self.UserId,
                    "client_mutation_id": "1"
                },
                "useDefaultActor": False,
                "__relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider": False
            }),
            "server_timestamps": "true",
            "doc_id": "8995964513767096",
        }
        
        response = requests.post("https://www.facebook.com/api/graphql/", headers=Headers, data=Data, verify=False)
        
        try:
            JsonResponse = response.json()
            if JsonResponse.get('data', {}).get('feedback_react') is None:
                ErrorMessage = ''
                if 'errors' in JsonResponse:
                    error = JsonResponse['errors'][0]
                    ErrorMessage = error.get('description', '')
                return {
                    'status': 'false',
                    'message': ErrorMessage or f'Thả cảm xúc {Reaction.name} thất bại',
                    'data': ErrorMessage
                }
                
            if JsonResponse.get('data', {}).get('feedback_react', {}).get('feedback'):
                return {'status': 'true', 'message': f'Thả cảm xúc {Reaction.name} thành công'}
                
            return {'status': 'false', 'message': f'Thả cảm xúc {Reaction.name} thất bại'}
            
        except:
            return {'status': 'false', 'message': 'Lỗi phản hồi', 'data': response.text}
    
    def CommentToPost(self, PostId, CommentText):
        """
        Thêm comment vào bài viết
        """
        Headers = self.BaseHeaders.copy()
        Headers.update({
            'x-fb-friendly-name': "useCometUFICreateCommentMutation",
            'x-asbd-id': "359341",
            'x-fb-lsd': self.LsdToken,
            'content-type': "application/x-www-form-urlencoded",
            'origin': "https://www.facebook.com",
            'sec-fetch-site': "same-origin",
            'sec-fetch-mode': "cors",
            'sec-fetch-dest': "empty",
            'referer': "https://www.facebook.com",
            'accept': "*/*",
            'priority': "u=1, i"
        })
        
        # Tạo feedback_id từ post_id
        FeedbackId = base64.b64encode(f"feedback:{PostId}".encode()).decode()
        
        # Tạo session_id và tracking ngẫu nhiên
        SessionId = f"{random.randint(10000000, 99999999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(100000000000, 999999999999)}"
        TrackingId = f"client:{random.randint(10000000, 99999999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(10, 99)}-{random.randint(100000000000, 999999999999)}"
        
        Variables = {
            "feedLocation": "DEDICATED_COMMENTING_SURFACE",
            "feedbackSource": 110,
            "groupID": None,
            "input": {
                "client_mutation_id": str(random.randint(1, 10)),
                "actor_id": self.UserId,
                "attachments": None,
                "feedback_id": FeedbackId,
                "formatting_style": None,
                "message": {
                    "ranges": [],
                    "text": CommentText
                },
                "attribution_id_v2": f"CometHomeRoot.react,comet.home,via_cold_start,{int(time.time() * 1000)},267777,4748854339,,",
                "vod_video_timestamp": None,
                "is_tracking_encrypted": True,
                "tracking": [f"AZU--Y8fqhFU6wdqm2dv4ScDtzoqSjaKIvmxxFjc4NYEpBj24IHQsNWgdlFg41RsurXuvrZJwWx7jWMz1GyNw7aO4BHgLJtZTpYQJ-ZYZZg3dvrO24Z-GZbElUyKaHqSAqPRl5oJC86LFbJzLLi_cw2B_vtz79hiXlReGgixVt6yfc_grr5QTfhGWnnmq1joLURhkODfT2Yl-5_2m4Xc-eVbvjeXhpTBAfgdo54R3BgvDFMqNlmCnITtKxzFhlpUDKxRHoimsf98tORmW74gT0VT4AY1mybm_PvEwGyavNsfNKR574UDBRTp9eLStilYoJU6VmEDqSVTGHYzF0XLIrp-etBx4jiP1XI9CFN-Rs_mBV7-99pOWrPBuPV4hSXL0v3MtOq9L8QlIDh2L0nMDT7dHFuoVRLR2qbjmWmaRuUSE2V60RO5M0WpDs4enRYL73rCIXX2_wG_x1gUtQN82wqKMjQUX6EPbGc2tAlbjzeGMFik1_GnQO6YP3owOS3XO5n_v-1ySxwLyaWMZJLN_HRYj6HLz0amXFyvxsUsNXXm0TxjGeFAXgyPVdhD9sUsDK7Cku1Cb0T8k6zLxzz97Vc35wEnTdAn74FXMcMTyX0q4UZkVJBoKhZSKoHUzbtp65u3pUo9XP8YonAIuI_RC9S-OxwMb_7jZYinwoCCNSJ8Yoi6ohM6Cpj5zZGkYl57qoWN8TeiVNZG6G5dwzDu0bFoIBBpDgbJjlW4CFeNPNh7IQDJQUjRVpskp3RadVfO6jol9G6QUd0upZdJIzYHWQJMiUh0og5FfYe9cxxtNfaGKg7wQs5QmfS8FSn82wprfHOaM3wUrIcUEu1PCqcGzt4NjC9WeyLCvjD5S9ry4PAK9x1W3KIDDoW9jVWaz7_icMX33d2UdmDJwjfaYxvL87RnxYfldZ_s5WDI94l_hzMfHY7Vs3NodolVvtXvW3uTw7J2-LJJf9nutjUBEQuDPAf3Om51lQW4FCJUtdGbmq_lL7BQ1PFurUvrWIm56BEcYOUfpkqcmxU19wXTxYvdkJ9VF5br5bOEirwBH4-teRKiE1tPXcFXg7xWssjUCJoQG9fa0t-_2jQRZ5rTJOS9hxPaptDKz108hPYnTXFboSODA42wUJEq1ccGiutDWDvB4kKpZ6Tc3L_mXWUrYIVbiBpS"],
                "feedback_source": "DEDICATED_COMMENTING_SURFACE",
                "idempotence_token": TrackingId,
                "session_id": SessionId
            },
            "inviteShortLinkKey": None,
            "renderLocation": None,
            "scale": 1,
            "useDefaultActor": False,
            "focusCommentID": None,
            "__relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider": False,
            "__relay_internal__pv__IsWorkUserrelayprovider": False
        }
        
        Data = {
            'av': self.UserId,
            '__aaid': "0",
            '__user': self.UserId,
            '__a': "1",
            '__req': str(random.randint(20, 30)),
            '__hs': "20347.HYP:comet_pkg.2.1...0",
            'dpr': "1",
            '__ccg': "EXCELLENT",
            '__rev': "1027174263",
            '__s': f"{random.randint(100000, 999999)}:{random.randint(100000, 999999)}:{random.randint(100000, 999999)}",
            '__hsi': str(random.randint(7000000000000000000, 7999999999999999999)),
          '__dyn': "7xeUjGU5a5Q1ryaxG4Vp41twWwIxu13wFwhUKbgS3q2ibwNw9G2Saw8i2S1DwUx60GE5O0BU2_CxS320qa321Rwwwqo462mcwfG12wOx62G5Usw9m1YwBgK7o6C0Mo4G17yovwRwlE-U2exi4UaEW2G1jwUBwJK14xm3y11xfxmu3W3y261eBx_wHwfC2-awLyESE2KwwwOg2cwMwhEkxebwHwKG4UrwFg2fwxyo566k1FwgUjz89oeE-3WVU-4FqwIK6E4-mEbUaU2wwgo620XEaUcEK6Eqwl8",
          '__csr': "gaQ5c4I5srT2cl48j4NcAbElbf2dR5Pnkji8yhsYhkZiOhvh2qvRaWYLSz9d9iFHiiORBGoZ9allhuZrTVal5A-jFrAHAhQdiFiqFOlJaGBWnUOFFpF8O8Ax2ihGuEyeyEHFHGCnLy4haGzXyaBVoiUiKmuVokHiz8y9hESEKl6y8oDKuQeLAG4oyHUynyoB4Gqh0KgrKuFoggqxOmaCDAGG-5USm588omBwHCxmEgxiay8vBxq78y8yGzUW8wHgCdz8cVoBzUS8xa5UaoB2p89e4UkxWbz9A9Bzp9E9oO7orwtUhxKdg5qi6FVAi7eEkwiHx11qi6U5meBDxS10CzUKi4E7u5Uf8dUdEao-5GCx-323m1ww26XGqt0tE7a27jwgQewv8igad96zQ1nw4nyo2twlE2Kobo-11wjEc98460NdefAU5i015VBw2Io6-1Lw1H60wQ0Fk051U1aU1tJ0goKbwcq0fPw9600Rso18C0xE22wmE2uw78Dg6608Xw2Ro0WNw4hwu8Dg12k4E429ykcy4045bw8Jw308lgoS780iggeE6m04ejw1JG13wSw3-U9E9o0Sm05iy0lYw0UC2xxG1ug7eE0h1y86p03d821Q480Gmt0Bw3uU3hw1We08yyoB38C1Qg0Imu",
          '__hsdp': "g5GAo6q1IyEG4YmxGaxONOuw_3oREgO8iyI4aideT7EWAdpykyFgwyYgxt8kOA8sixy326866wP2BgMxrt73W35gybi7gYy9hs9M_3j2y6PkwYhE9EF22pTmgyExX-EyFUlWgAyhagzxpzOZOfm5SamaDqG5aafi4lqagCDKlaWKT47dCCsJOn4-xjqNbAleizaHsiHyOmBjyAx_4QF1eipza8eggQmbhpBmn8_q46zyAAmlhJbF442AcoC-Cuiqxa4G8UjGdqybLolG8AmYgmtamh34-Huf8ejrDChVUlwHzbF4h8lCxmEO2Ne2p9jDhowwtjy8C4EybUyFAE8A4olx96yEF2a8kB47dqWBhpzcB4G9whoG8QgEG4k9wCVK1HyosDzo8pUWAsMCh0kUhyd1O48oo2wwkmdgG0A8MwaEK6U2jwF7wIxaewg4iHNgeoG8z42B1RobUyUm4e4C5HwlA1zaU4ufgGdx2qWyEWokngo70lokglwLg53wywGwyzi0Mwb6hAN8b82LG1EwIwhUfo2ZwRDxW4814E3Dw4ra6Utzo4N0gU1Ao1vUdU31wb6awuE5O0lm0R41bwvoym0G8cU1wUtwloc85W2OdwoorwoE27xG4o1xU1yo2hg3twBwGwa-0_o660xo25wg88E3ywc21nwvUkxqawWw9u0crwMwZwbu0p20DU1v85a09ow",
          '__hblp': "0kA61596Vk44u1gwg8nrwLwlA7U8EbFEeU2gU7G59ES1awjE27xS2mayUdpU5OU5O1ywhpUpzo88S6Ucoa8hUym8x21CwoFo4ibyU2wx-78ycwChAEgyo8U5y8yUc45EhwHwCw8K9CxyE5u17wDyo2qwLUiWwsohyaxO48owaa1izEf20r82Vwho5W0H8e89Gyo898O7bg6C7o6gzwm8d40T821wAwGwyw9a0Yomw8u1rwhUfo9ouwaW2q48dE2zzk0gGm1awf27oS0sW3Kazo460Io2bwMCxC3yfwv86e3G0RU7-2G587-1uws8rwqEox23S0yE8Ungqx236Uy18wvE6K5FEa8b8c85W2OdwoorwoE5i3a6ESUgwtE5Fe1UwCw69Dw8B1S1Fwlo9k2Cq3-1whk0AE5-awgovxW1Cw8m10wywFwby0M8C3G4ESfx612z8kxqawWw9u0gq0vO5UbEdVU4O1Gw6gw9-0HoO17x65ohKUnxiawRwj9o18Elwde8O7xS1yw",
          '__sjsp': "g5GAo6q1IyFW4YmxGaxONOp0_n4TtzCx3QBcJJy1DeAA9pa48GWiAFSoCOBoDj9N2sOiHaOCgEOPmGEGbaRrLGjxJ2F_8u9yV8Xurjjt2216axCjxR0xBHzke9UMF9yi0xAG5A5oFCjeX8q6kagx12eDxnx2At28ooZkQBBm5Sam4KEnCzQyQjExi6UBaqV4t7okFF2oSahqzp4EyGprUxaUOS2u4p22VKf8fx2E8BByEkzyyqCNJ7g94eXy8j8awAxa8wxG8AhUoBAgNeaU8kSVVAu1mKAh1G0AEnoujxa4Emyawqkq5EIxiaghaqF9Elo2ogeo7u0xE7q0ly0OUK6U2jwF7wjE414GYk1qwGg2Hw5V55Q61M5m540L81hCj4wIwa-08qw3hyw9h014-0Io25w6Owdi1cwvoW",
            '__comet_req': "15",
            'fb_dtsg': self.DtsgToken,
            'jazoest': self.Jazoest,
            'lsd': self.LsdToken,
            '__spin_r': "1027174263",
            '__spin_b': "trunk",
            '__spin_t': str(int(time.time())),
            '__crn': "comet.fbweb.CometHomeRoute",
            'fb_api_caller_class': "RelayModern",
            'fb_api_req_friendly_name': "useCometUFICreateCommentMutation",
            'variables': json.dumps(Variables),
            'server_timestamps': "true",
            'doc_id': "24356199814008185"
        }
        
        response = requests.post("https://www.facebook.com/api/graphql/", headers=Headers, data=Data, verify=False)

        try:
            JsonResponse = response.json()

            data = JsonResponse.get("data", {})
            comment_create = data.get("comment_create", {})

            # Nếu có feedback_comment_edge.node.id thì coi như thành công
            feedback_edge = comment_create.get("feedback_comment_edge", {})
            node = feedback_edge.get("node", {})
            if node.get("id"):
                return {
                    "status": "true",
                    "message": f'Comment thành công: "{CommentText[:30]}..."',
                    "data": node
                }

            # Nếu có thông báo disable thì vẫn check riêng
            notice_renderer = comment_create.get("feedback", {}).get("comments_disabled_notice_renderer")
            if notice_renderer and notice_renderer.get("__typename") == "GeneralCommentDisableNotice":
                return {
                    "status": "true",  # vẫn success
                    "message": notice_renderer.get("notice_message", {}).get("text", "Bình luận đã bị tắt (UI) nhưng API vẫn cho phép"),
                    "data": notice_renderer
                }

            # Nếu không có comment thì xử lý lỗi
            ErrorMessage = ""
            if "errors" in JsonResponse:
                error = JsonResponse["errors"][0]
                ErrorMessage = error.get("description", "")
            return {
                "status": "false",
                "message": ErrorMessage or "Comment thất bại",
                "data": ErrorMessage
            }

        except Exception as e:
            return {
                "status": "false",
                "message": "Lỗi phản hồi comment",
                "data": response.text
            }


    def AutoReactAndComment(self, ReactionType="LIKE", CommentTexts=None, UseReaction=True, UseComment=True, Delay=3, FetchInterval=300):
        """
        Tự động thả cảm xúc và comment cho bài viết
        Args:
            ReactionType: Loại cảm xúc (LIKE, LOVE, CARE, HAHA, WOW, SAD, ANGER, random)
            CommentTexts: Danh sách nội dung comment hoặc None để không comment
            UseReaction: Có thả cảm xúc không
            UseComment: Có comment không
            Delay: Thời gian nghỉ giữa các bài viết (giây)
            FetchInterval: Thời gian nghỉ giữa các lần lấy bài viết mới (giây)
        """
        print("\n🚀 BẮT ĐẦU QUY TRÌNH TỰ ĐỘNG (REACTION + COMMENT)")
        
        # Mặc định comment nếu không cung cấp
        if CommentTexts is None:
            CommentTexts = [
                "Nice post! 👍",
                "Great content! 🔥",
                "Love this! ❤️",
                "Amazing! 😍",
                "So good! 👌",
                "Perfect! 💯",
                "Awesome! 🚀",
                "Beautiful! ✨",
                "Incredible! 🙌",
                "Fantastic! 🎉"
            ]
        
        ValidReactions = [r for r in FacebookReaction if r != FacebookReaction.CANCEL]
        
        while True:
            Posts = self.GetNewsFeedPosts()
            
            if not Posts:
                print("❌ Không tìm thấy bài viết nào")
            else:
                print(f"\n🔄 BƯỚC 3: Xử lý {len(Posts)} bài viết...")
                
                Results = []
                for i, Post in enumerate(Posts, 1):
                    print(f"\n--- BÀI VIẾT {i}/{len(Posts)} ---")
                    print(f"👤 {Post['user_name']} (ID: {Post['user_id']})")
                    print(f"🔗 ID bài viết: {Post['post_id']}")
                    
                    PostResult = {
                        'post': Post,
                        'reaction': None,
                        'comment': None
                    }
                    
                    # Thả cảm xúc
                    if UseReaction:
                        if ReactionType.lower() == "random":
                            Reaction = random.choice(ValidReactions)
                        else:
                            Reaction = FacebookReaction[ReactionType] if isinstance(ReactionType, str) else ReactionType
                        
                        ReactionResult = self.ReactToPost(Post['post_id'], Reaction)
                        PostResult['reaction'] = ReactionResult
                        
                        if ReactionResult['status'] == 'true':
                            print(f"✅ {ReactionResult['message']}")
                        else:
                            print(f"❌ {ReactionResult['message']}")
                        
                        # Nghỉ giữa reaction và comment
                        if UseComment:
                            time.sleep(1)
                    
                    # Comment
                    if UseComment and CommentTexts:
                        CommentText = random.choice(CommentTexts)
                        CommentResult = self.CommentToPost(Post['post_id'], CommentText)
                        PostResult['comment'] = CommentResult
                        
                        if CommentResult['status'] == 'true':
                            print(f"✅ {CommentResult['message']}")
                        else:
                            print(f"❌ {CommentResult['message']}")
                    
                    Results.append(PostResult)
                    
                    if i < len(Posts):
                        print(f"⏳ Chờ {Delay}s...")
                        time.sleep(Delay)
                
                # Thống kê kết quả
                ReactionSuccess = sum(1 for r in Results if r['reaction'] and r['reaction']['status'] == 'true')
                CommentSuccess = sum(1 for r in Results if r['comment'] and r['comment']['status'] == 'true')
                
                print(f"\n🎉 HOÀN THÀNH:")
                if UseReaction:
                    print(f"   ❤️ Thả cảm xúc: {ReactionSuccess}/{len(Posts)} thành công")
                if UseComment:
                    print(f"   💬 Comment: {CommentSuccess}/{len(Posts)} thành công")
            
            print(f"\n⏳ Chờ {FetchInterval}s trước khi lấy News Feed tiếp theo...")
            time.sleep(FetchInterval)
        
        return Results
    
    def AutoReactAll(self, ReactionType="LIKE", Delay=2, FetchInterval=300):
        """Chỉ thả cảm xúc (để tương thích với mã cũ)"""
        return self.AutoReactAndComment(
            ReactionType=ReactionType,
            CommentTexts=None,
            UseReaction=True,
            UseComment=False,
            Delay=Delay,
            FetchInterval=FetchInterval
        )

if __name__ == "__main__":
    Cookie = ""
    
    FbAuto = FacebookAutoReaction(Cookie)

    # ========== CÁC CÁCH SỬ DỤNG ==========
    
    # 1. CHỈ THẢ CẢM XÚC (như mã cũ)
    # Results = FbAuto.AutoReactAll(ReactionType="random", Delay=3, FetchInterval=300)
    
    # 2. CHỈ COMMENT (không thả cảm xúc)
    # CommentList = [
    #     "Hay quá! 👍",
    #     "Tuyệt vời! 🔥", 
    #     "Cảm ơn bạn đã chia sẻ! ❤️",
    #     "Thông tin hữu ích! 💯"
    # ]
    # Results = FbAuto.AutoReactAndComment(
    #     UseReaction=False, 
    #     UseComment=True, 
    #     CommentTexts=CommentList,
    #     Delay=3, 
    #     FetchInterval=300
    # )
    
    # 3. VỪA THẢ CẢM XÚC VỪA COMMENT
    MyComments = [
        "Bài viết hay quá! 👍",
        "Cảm ơn bạn đã chia sẻ! ❤️",
        "Thông tin rất bổ ích! 🔥",
        "Tuyệt vời! 💯",
        "Love this post! 😍"
    ]
    
    Results = FbAuto.AutoReactAndComment(
        ReactionType="random",        # Loại cảm xúc (LIKE, LOVE, random, v.v.)
        CommentTexts=MyComments,      # Danh sách comment
        UseReaction=True,             # Có thả cảm xúc không
        UseComment=True,              # Có comment không  
        Delay=5,                      # Nghỉ 5 giây giữa các bài viết
        FetchInterval=300             # Lấy bài viết mới mỗi 5 phút
    )