import Foundation
import Security
import SwiftUI
import AVFoundation

enum TTSProvider: String, Codable, CaseIterable, Identifiable {
    case minimax, openAICompatible
    var id: String { rawValue }
    var title: String { self == .minimax ? "minimax-cn" : "OpenAI" }
    var baseURL: String { self == .minimax ? "https://api.minimax.cn/v1" : "https://api.openai.com/v1" }
    var defaultModel: String { self == .minimax ? "speech-2.8-hd" : "gpt-4o-mini-tts" }
    var defaultVoice: String { self == .minimax ? "Japanese_Whisper_Belle" : "coral" }
}


struct TTSVoiceOption: Identifiable {
    let id: String
    let title: String
    let language: String
}

extension TTSProvider {
    // Official catalogs: platform.minimax.cn/docs/api-reference/speech-t2a-http
    // and developers.openai.com/api/docs/guides/text-to-speech.
    var models: [String] {
        self == .minimax
            ? ["speech-2.8-hd", "speech-2.8-turbo", "speech-2.6-hd", "speech-2.6-turbo", "speech-02-hd", "speech-02-turbo", "speech-01-hd", "speech-01-turbo"]
            : ["gpt-4o-mini-tts", "tts-1", "tts-1-hd"]
    }

    func voices(for model: String) -> [TTSVoiceOption] {
        if self == .minimax { return Self.minimaxVoices }
        let ids = model == "tts-1" || model == "tts-1-hd"
            ? ["alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"]
            : ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]
        return ids.map { TTSVoiceOption(id: $0, title: $0.capitalized, language: "") }
    }

    // Languages exposed by the app for voice configuration and preview.
    func languages(for model: String) -> [String] {
        models.contains(model) ? ["zh", "en", "ja", "ru", "el"] : []
    }

    func languageKey(_ language: String?, model: String) -> String? {
        guard let language else { return nil }
        let code = language.lowercased()
        let base = code.split(separator: "-").first.map(String.init) ?? ""
        let key: String
        if code == "zh-yue" || code.hasPrefix("zh-yue-") { key = "yue" }
        else if base == "nb" { key = "no" }
        else if base == "tl" && self == .minimax { key = "fil" }
        else if base == "fil" && self == .openAICompatible { key = "tl" }
        else { key = base }
        return languages(for: model).contains(key) ? key : nil
    }

    func voiceOptions(for model: String, language: String?) -> [TTSVoiceOption] {
        let all = voices(for: model)
        guard self == .minimax, let language else { return all }
        let native = all.filter { $0.language == language }
        // MiniMax voices are multilingual. Languages without a dedicated voice
        // can choose from the full system voice catalog.
        return native.isEmpty ? all : native
    }

    // System voices: https://platform.minimax.cn/docs/faq/system-voice-id
    static let minimaxVoices: [TTSVoiceOption] = [
        .init(id: "Japanese_Whisper_Belle", title: "Whisper Belle", language: "ja"),
        .init(id: "male-qn-qingse", title: "青涩青年音色", language: "zh"),
        .init(id: "male-qn-jingying", title: "精英青年音色", language: "zh"),
        .init(id: "male-qn-badao", title: "霸道青年音色", language: "zh"),
        .init(id: "male-qn-daxuesheng", title: "青年大学生音色", language: "zh"),
        .init(id: "female-shaonv", title: "少女音色", language: "zh"),
        .init(id: "female-yujie", title: "御姐音色", language: "zh"),
        .init(id: "female-chengshu", title: "成熟女性音色", language: "zh"),
        .init(id: "female-tianmei", title: "甜美女性音色", language: "zh"),
        .init(id: "male-qn-qingse-jingpin", title: "青涩青年音色-beta", language: "zh"),
        .init(id: "male-qn-jingying-jingpin", title: "精英青年音色-beta", language: "zh"),
        .init(id: "male-qn-badao-jingpin", title: "霸道青年音色-beta", language: "zh"),
        .init(id: "male-qn-daxuesheng-jingpin", title: "青年大学生音色-beta", language: "zh"),
        .init(id: "female-shaonv-jingpin", title: "少女音色-beta", language: "zh"),
        .init(id: "female-yujie-jingpin", title: "御姐音色-beta", language: "zh"),
        .init(id: "female-chengshu-jingpin", title: "成熟女性音色-beta", language: "zh"),
        .init(id: "female-tianmei-jingpin", title: "甜美女性音色-beta", language: "zh"),
        .init(id: "clever_boy", title: "聪明男童", language: "zh"),
        .init(id: "cute_boy", title: "可爱男童", language: "zh"),
        .init(id: "lovely_girl", title: "萌萌女童", language: "zh"),
        .init(id: "cartoon_pig", title: "卡通猪小琪", language: "zh"),
        .init(id: "bingjiao_didi", title: "病娇弟弟", language: "zh"),
        .init(id: "junlang_nanyou", title: "俊朗男友", language: "zh"),
        .init(id: "chunzhen_xuedi", title: "纯真学弟", language: "zh"),
        .init(id: "lengdan_xiongzhang", title: "冷淡学长", language: "zh"),
        .init(id: "badao_shaoye", title: "霸道少爷", language: "zh"),
        .init(id: "tianxin_xiaoling", title: "甜心小玲", language: "zh"),
        .init(id: "qiaopi_mengmei", title: "俏皮萌妹", language: "zh"),
        .init(id: "wumei_yujie", title: "妩媚御姐", language: "zh"),
        .init(id: "diadia_xuemei", title: "嗲嗲学妹", language: "zh"),
        .init(id: "danya_xuejie", title: "淡雅学姐", language: "zh"),
        .init(id: "Chinese (Mandarin)_Reliable_Executive", title: "沉稳高管", language: "zh"),
        .init(id: "Chinese (Mandarin)_News_Anchor", title: "新闻女声", language: "zh"),
        .init(id: "Chinese (Mandarin)_Mature_Woman", title: "傲娇御姐", language: "zh"),
        .init(id: "Chinese (Mandarin)_Unrestrained_Young_Man", title: "不羁青年", language: "zh"),
        .init(id: "Arrogant_Miss", title: "嚣张小姐", language: "zh"),
        .init(id: "Robot_Armor", title: "机械战甲", language: "zh"),
        .init(id: "Chinese (Mandarin)_Kind-hearted_Antie", title: "热心大婶", language: "zh"),
        .init(id: "Chinese (Mandarin)_HK_Flight_Attendant", title: "港普空姐", language: "zh"),
        .init(id: "Chinese (Mandarin)_Humorous_Elder", title: "搞笑大爷", language: "zh"),
        .init(id: "Chinese (Mandarin)_Gentleman", title: "温润男声", language: "zh"),
        .init(id: "Chinese (Mandarin)_Warm_Bestie", title: "温暖闺蜜", language: "zh"),
        .init(id: "Chinese (Mandarin)_Male_Announcer", title: "播报男声", language: "zh"),
        .init(id: "Chinese (Mandarin)_Sweet_Lady", title: "甜美女声", language: "zh"),
        .init(id: "Chinese (Mandarin)_Southern_Young_Man", title: "南方小哥", language: "zh"),
        .init(id: "Chinese (Mandarin)_Wise_Women", title: "阅历姐姐", language: "zh"),
        .init(id: "Chinese (Mandarin)_Gentle_Youth", title: "温润青年", language: "zh"),
        .init(id: "Chinese (Mandarin)_Warm_Girl", title: "温暖少女", language: "zh"),
        .init(id: "Chinese (Mandarin)_Kind-hearted_Elder", title: "花甲奶奶", language: "zh"),
        .init(id: "Chinese (Mandarin)_Cute_Spirit", title: "憨憨萌兽", language: "zh"),
        .init(id: "Chinese (Mandarin)_Radio_Host", title: "电台男主播", language: "zh"),
        .init(id: "Chinese (Mandarin)_Lyrical_Voice", title: "抒情男声", language: "zh"),
        .init(id: "Chinese (Mandarin)_Straightforward_Boy", title: "率真弟弟", language: "zh"),
        .init(id: "Chinese (Mandarin)_Sincere_Adult", title: "真诚青年", language: "zh"),
        .init(id: "Chinese (Mandarin)_Gentle_Senior", title: "温柔学姐", language: "zh"),
        .init(id: "Chinese (Mandarin)_Stubborn_Friend", title: "嘴硬竹马", language: "zh"),
        .init(id: "Chinese (Mandarin)_Crisp_Girl", title: "清脆少女", language: "zh"),
        .init(id: "Chinese (Mandarin)_Pure-hearted_Boy", title: "清澈邻家弟弟", language: "zh"),
        .init(id: "Chinese (Mandarin)_Soft_Girl", title: "柔和少女", language: "zh"),
        .init(id: "Cantonese_ProfessionalHost（F)", title: "专业女主持", language: "yue"),
        .init(id: "Cantonese_GentleLady", title: "温柔女声", language: "yue"),
        .init(id: "Cantonese_ProfessionalHost（M)", title: "专业男主持", language: "yue"),
        .init(id: "Cantonese_PlayfulMan", title: "活泼男声", language: "yue"),
        .init(id: "Cantonese_CuteGirl", title: "可爱女孩", language: "yue"),
        .init(id: "Cantonese_KindWoman", title: "善良女声", language: "yue"),
        .init(id: "Santa_Claus", title: "Santa Claus", language: "en"),
        .init(id: "Grinch", title: "Grinch", language: "en"),
        .init(id: "Rudolph", title: "Rudolph", language: "en"),
        .init(id: "Arnold", title: "Arnold", language: "en"),
        .init(id: "Charming_Santa", title: "Charming Santa", language: "en"),
        .init(id: "Charming_Lady", title: "Charming Lady", language: "en"),
        .init(id: "Sweet_Girl", title: "Sweet Girl", language: "en"),
        .init(id: "Cute_Elf", title: "Cute Elf", language: "en"),
        .init(id: "Attractive_Girl", title: "Attractive Girl", language: "en"),
        .init(id: "Serene_Woman", title: "Serene Woman", language: "en"),
        .init(id: "English_Trustworthy_Man", title: "Trustworthy Man", language: "en"),
        .init(id: "English_Graceful_Lady", title: "Graceful Lady", language: "en"),
        .init(id: "English_Aussie_Bloke", title: "Aussie Bloke", language: "en"),
        .init(id: "English_Whispering_girl", title: "Whispering girl", language: "en"),
        .init(id: "English_Diligent_Man", title: "Diligent Man", language: "en"),
        .init(id: "English_Gentle-voiced_man", title: "Gentle-voiced man", language: "en"),
        .init(id: "Japanese_IntellectualSenior", title: "Intellectual Senior", language: "ja"),
        .init(id: "Japanese_DecisivePrincess", title: "Decisive Princess", language: "ja"),
        .init(id: "Japanese_LoyalKnight", title: "Loyal Knight", language: "ja"),
        .init(id: "Japanese_DominantMan", title: "Dominant Man", language: "ja"),
        .init(id: "Japanese_SeriousCommander", title: "Serious Commander", language: "ja"),
        .init(id: "Japanese_ColdQueen", title: "Cold Queen", language: "ja"),
        .init(id: "Japanese_DependableWoman", title: "Dependable Woman", language: "ja"),
        .init(id: "Japanese_GentleButler", title: "Gentle Butler", language: "ja"),
        .init(id: "Japanese_KindLady", title: "Kind Lady", language: "ja"),
        .init(id: "Japanese_CalmLady", title: "Calm Lady", language: "ja"),
        .init(id: "Japanese_OptimisticYouth", title: "Optimistic Youth", language: "ja"),
        .init(id: "Japanese_GenerousIzakayaOwner", title: "Generous Izakaya Owner", language: "ja"),
        .init(id: "Japanese_SportyStudent", title: "Sporty Student", language: "ja"),
        .init(id: "Japanese_InnocentBoy", title: "Innocent Boy", language: "ja"),
        .init(id: "Japanese_GracefulMaiden", title: "Graceful Maiden", language: "ja"),
        .init(id: "Korean_SweetGirl", title: "Sweet Girl", language: "ko"),
        .init(id: "Korean_CheerfulBoyfriend", title: "Cheerful Boyfriend", language: "ko"),
        .init(id: "Korean_EnchantingSister", title: "Enchanting Sister", language: "ko"),
        .init(id: "Korean_ShyGirl", title: "Shy Girl", language: "ko"),
        .init(id: "Korean_ReliableSister", title: "Reliable Sister", language: "ko"),
        .init(id: "Korean_StrictBoss", title: "Strict Boss", language: "ko"),
        .init(id: "Korean_SassyGirl", title: "Sassy Girl", language: "ko"),
        .init(id: "Korean_ChildhoodFriendGirl", title: "Childhood Friend Girl", language: "ko"),
        .init(id: "Korean_PlayboyCharmer", title: "Playboy Charmer", language: "ko"),
        .init(id: "Korean_ElegantPrincess", title: "Elegant Princess", language: "ko"),
        .init(id: "Korean_BraveFemaleWarrior", title: "Brave Female Warrior", language: "ko"),
        .init(id: "Korean_BraveYouth", title: "Brave Youth", language: "ko"),
        .init(id: "Korean_CalmLady", title: "Calm Lady", language: "ko"),
        .init(id: "Korean_EnthusiasticTeen", title: "Enthusiastic Teen", language: "ko"),
        .init(id: "Korean_SoothingLady", title: "Soothing Lady", language: "ko"),
        .init(id: "Korean_IntellectualSenior", title: "Intellectual Senior", language: "ko"),
        .init(id: "Korean_LonelyWarrior", title: "Lonely Warrior", language: "ko"),
        .init(id: "Korean_MatureLady", title: "Mature Lady", language: "ko"),
        .init(id: "Korean_InnocentBoy", title: "Innocent Boy", language: "ko"),
        .init(id: "Korean_CharmingSister", title: "Charming Sister", language: "ko"),
        .init(id: "Korean_AthleticStudent", title: "Athletic Student", language: "ko"),
        .init(id: "Korean_BraveAdventurer", title: "Brave Adventurer", language: "ko"),
        .init(id: "Korean_CalmGentleman", title: "Calm Gentleman", language: "ko"),
        .init(id: "Korean_WiseElf", title: "Wise Elf", language: "ko"),
        .init(id: "Korean_CheerfulCoolJunior", title: "Cheerful Cool Junior", language: "ko"),
        .init(id: "Korean_DecisiveQueen", title: "Decisive Queen", language: "ko"),
        .init(id: "Korean_ColdYoungMan", title: "Cold Young Man", language: "ko"),
        .init(id: "Korean_MysteriousGirl", title: "Mysterious Girl", language: "ko"),
        .init(id: "Korean_QuirkyGirl", title: "Quirky Girl", language: "ko"),
        .init(id: "Korean_ConsiderateSenior", title: "Considerate Senior", language: "ko"),
        .init(id: "Korean_CheerfulLittleSister", title: "Cheerful Little Sister", language: "ko"),
        .init(id: "Korean_DominantMan", title: "Dominant Man", language: "ko"),
        .init(id: "Korean_AirheadedGirl", title: "Airheaded Girl", language: "ko"),
        .init(id: "Korean_ReliableYouth", title: "Reliable Youth", language: "ko"),
        .init(id: "Korean_FriendlyBigSister", title: "Friendly Big Sister", language: "ko"),
        .init(id: "Korean_GentleBoss", title: "Gentle Boss", language: "ko"),
        .init(id: "Korean_ColdGirl", title: "Cold Girl", language: "ko"),
        .init(id: "Korean_HaughtyLady", title: "Haughty Lady", language: "ko"),
        .init(id: "Korean_CharmingElderSister", title: "Charming Elder Sister", language: "ko"),
        .init(id: "Korean_IntellectualMan", title: "Intellectual Man", language: "ko"),
        .init(id: "Korean_CaringWoman", title: "Caring Woman", language: "ko"),
        .init(id: "Korean_WiseTeacher", title: "Wise Teacher", language: "ko"),
        .init(id: "Korean_ConfidentBoss", title: "Confident Boss", language: "ko"),
        .init(id: "Korean_AthleticGirl", title: "Athletic Girl", language: "ko"),
        .init(id: "Korean_PossessiveMan", title: "Possessive Man", language: "ko"),
        .init(id: "Korean_GentleWoman", title: "Gentle Woman", language: "ko"),
        .init(id: "Korean_CockyGuy", title: "Cocky Guy", language: "ko"),
        .init(id: "Korean_ThoughtfulWoman", title: "Thoughtful Woman", language: "ko"),
        .init(id: "Korean_OptimisticYouth", title: "Optimistic Youth", language: "ko"),
        .init(id: "Spanish_SereneWoman", title: "Serene Woman", language: "es"),
        .init(id: "Spanish_MaturePartner", title: "Mature Partner", language: "es"),
        .init(id: "Spanish_CaptivatingStoryteller", title: "Captivating Storyteller", language: "es"),
        .init(id: "Spanish_Narrator", title: "Narrator", language: "es"),
        .init(id: "Spanish_WiseScholar", title: "Wise Scholar", language: "es"),
        .init(id: "Spanish_Kind-heartedGirl", title: "Kind-hearted Girl", language: "es"),
        .init(id: "Spanish_DeterminedManager", title: "Determined Manager", language: "es"),
        .init(id: "Spanish_BossyLeader", title: "Bossy Leader", language: "es"),
        .init(id: "Spanish_ReservedYoungMan", title: "Reserved Young Man", language: "es"),
        .init(id: "Spanish_ConfidentWoman", title: "Confident Woman", language: "es"),
        .init(id: "Spanish_ThoughtfulMan", title: "Thoughtful Man", language: "es"),
        .init(id: "Spanish_Strong-WilledBoy", title: "Strong-willed Boy", language: "es"),
        .init(id: "Spanish_SophisticatedLady", title: "Sophisticated Lady", language: "es"),
        .init(id: "Spanish_RationalMan", title: "Rational Man", language: "es"),
        .init(id: "Spanish_AnimeCharacter", title: "Anime Character", language: "es"),
        .init(id: "Spanish_Deep-tonedMan", title: "Deep-toned Man", language: "es"),
        .init(id: "Spanish_Fussyhostess", title: "Fussy hostess", language: "es"),
        .init(id: "Spanish_SincereTeen", title: "Sincere Teen", language: "es"),
        .init(id: "Spanish_FrankLady", title: "Frank Lady", language: "es"),
        .init(id: "Spanish_Comedian", title: "Comedian", language: "es"),
        .init(id: "Spanish_Debator", title: "Debator", language: "es"),
        .init(id: "Spanish_ToughBoss", title: "Tough Boss", language: "es"),
        .init(id: "Spanish_Wiselady", title: "Wise Lady", language: "es"),
        .init(id: "Spanish_Steadymentor", title: "Steady Mentor", language: "es"),
        .init(id: "Spanish_Jovialman", title: "Jovial Man", language: "es"),
        .init(id: "Spanish_SantaClaus", title: "Santa Claus", language: "es"),
        .init(id: "Spanish_Rudolph", title: "Rudolph", language: "es"),
        .init(id: "Spanish_Intonategirl", title: "Intonate Girl", language: "es"),
        .init(id: "Spanish_Arnold", title: "Arnold", language: "es"),
        .init(id: "Spanish_Ghost", title: "Ghost", language: "es"),
        .init(id: "Spanish_HumorousElder", title: "Humorous Elder", language: "es"),
        .init(id: "Spanish_EnergeticBoy", title: "Energetic Boy", language: "es"),
        .init(id: "Spanish_WhimsicalGirl", title: "Whimsical Girl", language: "es"),
        .init(id: "Spanish_StrictBoss", title: "Strict Boss", language: "es"),
        .init(id: "Spanish_ReliableMan", title: "Reliable Man", language: "es"),
        .init(id: "Spanish_SereneElder", title: "Serene Elder", language: "es"),
        .init(id: "Spanish_AngryMan", title: "Angry Man", language: "es"),
        .init(id: "Spanish_AssertiveQueen", title: "Assertive Queen", language: "es"),
        .init(id: "Spanish_CaringGirlfriend", title: "Caring Girlfriend", language: "es"),
        .init(id: "Spanish_PowerfulSoldier", title: "Powerful Soldier", language: "es"),
        .init(id: "Spanish_PassionateWarrior", title: "Passionate Warrior", language: "es"),
        .init(id: "Spanish_ChattyGirl", title: "Chatty Girl", language: "es"),
        .init(id: "Spanish_RomanticHusband", title: "Romantic Husband", language: "es"),
        .init(id: "Spanish_CompellingGirl", title: "Compelling Girl", language: "es"),
        .init(id: "Spanish_PowerfulVeteran", title: "Powerful Veteran", language: "es"),
        .init(id: "Spanish_SensibleManager", title: "Sensible Manager", language: "es"),
        .init(id: "Spanish_ThoughtfulLady", title: "Thoughtful Lady", language: "es"),
        .init(id: "Portuguese_SentimentalLady", title: "Sentimental Lady", language: "pt"),
        .init(id: "Portuguese_BossyLeader", title: "Bossy Leader", language: "pt"),
        .init(id: "Portuguese_Wiselady", title: "Wise lady", language: "pt"),
        .init(id: "Portuguese_Strong-WilledBoy", title: "Strong-willed Boy", language: "pt"),
        .init(id: "Portuguese_Deep-VoicedGentleman", title: "Deep-voiced Gentleman", language: "pt"),
        .init(id: "Portuguese_UpsetGirl", title: "Upset Girl", language: "pt"),
        .init(id: "Portuguese_PassionateWarrior", title: "Passionate Warrior", language: "pt"),
        .init(id: "Portuguese_AnimeCharacter", title: "Anime Character", language: "pt"),
        .init(id: "Portuguese_ConfidentWoman", title: "Confident Woman", language: "pt"),
        .init(id: "Portuguese_AngryMan", title: "Angry Man", language: "pt"),
        .init(id: "Portuguese_CaptivatingStoryteller", title: "Captivating Storyteller", language: "pt"),
        .init(id: "Portuguese_Godfather", title: "Godfather", language: "pt"),
        .init(id: "Portuguese_ReservedYoungMan", title: "Reserved Young Man", language: "pt"),
        .init(id: "Portuguese_SmartYoungGirl", title: "Smart Young Girl", language: "pt"),
        .init(id: "Portuguese_Kind-heartedGirl", title: "Kind-hearted Girl", language: "pt"),
        .init(id: "Portuguese_Pompouslady", title: "Pompous lady", language: "pt"),
        .init(id: "Portuguese_Grinch", title: "Grinch", language: "pt"),
        .init(id: "Portuguese_Debator", title: "Debator", language: "pt"),
        .init(id: "Portuguese_SweetGirl", title: "Sweet Girl", language: "pt"),
        .init(id: "Portuguese_AttractiveGirl", title: "Attractive Girl", language: "pt"),
        .init(id: "Portuguese_ThoughtfulMan", title: "Thoughtful Man", language: "pt"),
        .init(id: "Portuguese_PlayfulGirl", title: "Playful Girl", language: "pt"),
        .init(id: "Portuguese_GorgeousLady", title: "Gorgeous Lady", language: "pt"),
        .init(id: "Portuguese_LovelyLady", title: "Lovely Lady", language: "pt"),
        .init(id: "Portuguese_SereneWoman", title: "Serene Woman", language: "pt"),
        .init(id: "Portuguese_SadTeen", title: "Sad Teen", language: "pt"),
        .init(id: "Portuguese_MaturePartner", title: "Mature Partner", language: "pt"),
        .init(id: "Portuguese_Comedian", title: "Comedian", language: "pt"),
        .init(id: "Portuguese_NaughtySchoolgirl", title: "Naughty Schoolgirl", language: "pt"),
        .init(id: "Portuguese_Narrator", title: "Narrator", language: "pt"),
        .init(id: "Portuguese_ToughBoss", title: "Tough Boss", language: "pt"),
        .init(id: "Portuguese_Fussyhostess", title: "Fussy hostess", language: "pt"),
        .init(id: "Portuguese_Dramatist", title: "Dramatist", language: "pt"),
        .init(id: "Portuguese_Steadymentor", title: "Steady Mentor", language: "pt"),
        .init(id: "Portuguese_Jovialman", title: "Jovial Man", language: "pt"),
        .init(id: "Portuguese_CharmingQueen", title: "Charming Queen", language: "pt"),
        .init(id: "Portuguese_SantaClaus", title: "Santa Claus", language: "pt"),
        .init(id: "Portuguese_Rudolph", title: "Rudolph", language: "pt"),
        .init(id: "Portuguese_Arnold", title: "Arnold", language: "pt"),
        .init(id: "Portuguese_CharmingSanta", title: "Charming Santa", language: "pt"),
        .init(id: "Portuguese_CharmingLady", title: "Charming Lady", language: "pt"),
        .init(id: "Portuguese_Ghost", title: "Ghost", language: "pt"),
        .init(id: "Portuguese_HumorousElder", title: "Humorous Elder", language: "pt"),
        .init(id: "Portuguese_CalmLeader", title: "Calm Leader", language: "pt"),
        .init(id: "Portuguese_GentleTeacher", title: "Gentle Teacher", language: "pt"),
        .init(id: "Portuguese_EnergeticBoy", title: "Energetic Boy", language: "pt"),
        .init(id: "Portuguese_ReliableMan", title: "Reliable Man", language: "pt"),
        .init(id: "Portuguese_SereneElder", title: "Serene Elder", language: "pt"),
        .init(id: "Portuguese_GrimReaper", title: "Grim Reaper", language: "pt"),
        .init(id: "Portuguese_AssertiveQueen", title: "Assertive Queen", language: "pt"),
        .init(id: "Portuguese_WhimsicalGirl", title: "Whimsical Girl", language: "pt"),
        .init(id: "Portuguese_StressedLady", title: "Stressed Lady", language: "pt"),
        .init(id: "Portuguese_FriendlyNeighbor", title: "Friendly Neighbor", language: "pt"),
        .init(id: "Portuguese_CaringGirlfriend", title: "Caring Girlfriend", language: "pt"),
        .init(id: "Portuguese_PowerfulSoldier", title: "Powerful Soldier", language: "pt"),
        .init(id: "Portuguese_FascinatingBoy", title: "Fascinating Boy", language: "pt"),
        .init(id: "Portuguese_RomanticHusband", title: "Romantic Husband", language: "pt"),
        .init(id: "Portuguese_StrictBoss", title: "Strict Boss", language: "pt"),
        .init(id: "Portuguese_InspiringLady", title: "Inspiring Lady", language: "pt"),
        .init(id: "Portuguese_PlayfulSpirit", title: "Playful Spirit", language: "pt"),
        .init(id: "Portuguese_ElegantGirl", title: "Elegant Girl", language: "pt"),
        .init(id: "Portuguese_CompellingGirl", title: "Compelling Girl", language: "pt"),
        .init(id: "Portuguese_PowerfulVeteran", title: "Powerful Veteran", language: "pt"),
        .init(id: "Portuguese_SensibleManager", title: "Sensible Manager", language: "pt"),
        .init(id: "Portuguese_ThoughtfulLady", title: "Thoughtful Lady", language: "pt"),
        .init(id: "Portuguese_TheatricalActor", title: "Theatrical Actor", language: "pt"),
        .init(id: "Portuguese_FragileBoy", title: "Fragile Boy", language: "pt"),
        .init(id: "Portuguese_ChattyGirl", title: "Chatty Girl", language: "pt"),
        .init(id: "Portuguese_Conscientiousinstructor", title: "Conscientious Instructor", language: "pt"),
        .init(id: "Portuguese_RationalMan", title: "Rational Man", language: "pt"),
        .init(id: "Portuguese_WiseScholar", title: "Wise Scholar", language: "pt"),
        .init(id: "Portuguese_FrankLady", title: "Frank Lady", language: "pt"),
        .init(id: "Portuguese_DeterminedManager", title: "Determined Manager", language: "pt"),
        .init(id: "French_Male_Speech_New", title: "Level-Headed Man", language: "fr"),
        .init(id: "French_Female_News Anchor", title: "Patient Female Presenter", language: "fr"),
        .init(id: "French_CasualMan", title: "Casual Man", language: "fr"),
        .init(id: "French_MovieLeadFemale", title: "Movie Lead Female", language: "fr"),
        .init(id: "French_FemaleAnchor", title: "Female Anchor", language: "fr"),
        .init(id: "French_MaleNarrator", title: "Male Narrator", language: "fr"),
        .init(id: "Indonesian_SweetGirl", title: "Sweet Girl", language: "id"),
        .init(id: "Indonesian_ReservedYoungMan", title: "Reserved Young Man", language: "id"),
        .init(id: "Indonesian_CharmingGirl", title: "Charming Girl", language: "id"),
        .init(id: "Indonesian_CalmWoman", title: "Calm Woman", language: "id"),
        .init(id: "Indonesian_ConfidentWoman", title: "Confident Woman", language: "id"),
        .init(id: "Indonesian_CaringMan", title: "Caring Man", language: "id"),
        .init(id: "Indonesian_BossyLeader", title: "Bossy Leader", language: "id"),
        .init(id: "Indonesian_DeterminedBoy", title: "Determined Boy", language: "id"),
        .init(id: "Indonesian_GentleGirl", title: "Gentle Girl", language: "id"),
        .init(id: "German_FriendlyMan", title: "Friendly Man", language: "de"),
        .init(id: "German_SweetLady", title: "Sweet Lady", language: "de"),
        .init(id: "German_PlayfulMan", title: "Playful Man", language: "de"),
        .init(id: "Russian_HandsomeChildhoodFriend", title: "Handsome Childhood Friend", language: "ru"),
        .init(id: "Russian_BrightHeroine", title: "Bright Queen", language: "ru"),
        .init(id: "Russian_AmbitiousWoman", title: "Ambitious Woman", language: "ru"),
        .init(id: "Russian_ReliableMan", title: "Reliable Man", language: "ru"),
        .init(id: "Russian_CrazyQueen", title: "Crazy Girl", language: "ru"),
        .init(id: "Russian_PessimisticGirl", title: "Pessimistic Girl", language: "ru"),
        .init(id: "Russian_AttractiveGuy", title: "Attractive Guy", language: "ru"),
        .init(id: "Russian_Bad-temperedBoy", title: "Bad-tempered Boy", language: "ru"),
        .init(id: "Italian_BraveHeroine", title: "Brave Heroine", language: "it"),
        .init(id: "Italian_Narrator", title: "Narrator", language: "it"),
        .init(id: "Italian_WanderingSorcerer", title: "Wandering Sorcerer", language: "it"),
        .init(id: "Italian_DiligentLeader", title: "Diligent Leader", language: "it"),
        .init(id: "Arabic_CalmWoman", title: "Calm Woman", language: "ar"),
        .init(id: "Arabic_FriendlyGuy", title: "Friendly Guy", language: "ar"),
        .init(id: "Turkish_CalmWoman", title: "Calm Woman", language: "tr"),
        .init(id: "Turkish_Trustworthyman", title: "Trustworthy man", language: "tr"),
        .init(id: "Ukrainian_CalmWoman", title: "Calm Woman", language: "uk"),
        .init(id: "Ukrainian_WiseScholar", title: "Wise Scholar", language: "uk"),
        .init(id: "Dutch_kindhearted_girl", title: "Kind-hearted girl", language: "nl"),
        .init(id: "Dutch_bossy_leader", title: "Bossy leader", language: "nl"),
        .init(id: "Vietnamese_kindhearted_girl", title: "Kind-hearted girl", language: "vi"),
        .init(id: "Thai_male_1_sample8", title: "Serene Man", language: "th"),
        .init(id: "Thai_male_2_sample2", title: "Friendly Man", language: "th"),
        .init(id: "Thai_female_1_sample1", title: "Confident Woman", language: "th"),
        .init(id: "Thai_female_2_sample2", title: "Energetic Woman", language: "th"),
        .init(id: "Polish_male_1_sample4", title: "Male Narrator", language: "pl"),
        .init(id: "Polish_male_2_sample3", title: "Male Anchor", language: "pl"),
        .init(id: "Polish_female_1_sample1", title: "Calm Woman", language: "pl"),
        .init(id: "Polish_female_2_sample3", title: "Casual Woman", language: "pl"),
        .init(id: "Romanian_male_1_sample2", title: "Reliable Man", language: "ro"),
        .init(id: "Romanian_male_2_sample1", title: "Energetic Youth", language: "ro"),
        .init(id: "Romanian_female_1_sample4", title: "Optimistic Youth", language: "ro"),
        .init(id: "Romanian_female_2_sample1", title: "Gentle Woman", language: "ro"),
        .init(id: "greek_male_1a_v1", title: "Thoughtful Mentor", language: "el"),
        .init(id: "Greek_female_1_sample1", title: "Gentle Lady", language: "el"),
        .init(id: "Greek_female_2_sample3", title: "Girl Next Door", language: "el"),
        .init(id: "czech_male_1_v1", title: "Assured Presenter", language: "cs"),
        .init(id: "czech_female_5_v7", title: "Steadfast Narrator", language: "cs"),
        .init(id: "czech_female_2_v2", title: "Elegant Lady", language: "cs"),
        .init(id: "finnish_male_3_v1", title: "Upbeat Man", language: "fi"),
        .init(id: "finnish_male_1_v2", title: "Friendly Boy", language: "fi"),
        .init(id: "finnish_female_4_v1", title: "Assetive Woman", language: "fi"),
        .init(id: "hindi_male_1_v2", title: "Trustworthy Advisor", language: "hi"),
        .init(id: "hindi_female_2_v1", title: "Tranquil Woman", language: "hi"),
        .init(id: "hindi_female_1_v2", title: "News Anchor", language: "hi"),
    ]
}

struct TTSConfiguration: Codable, Equatable {
    var provider: TTSProvider = .minimax
    var model = TTSProvider.minimax.defaultModel
    var voice = TTSProvider.minimax.defaultVoice
    var languageVoices: [String: String]?
    var token = ""
    var speed = 1.0

    static func defaults(for provider: TTSProvider) -> Self {
        Self(provider: provider, model: provider.defaultModel, voice: provider.defaultVoice)
    }

    func voice(for language: String?) -> String {
        guard let key = provider.languageKey(language, model: model) else { return voice }
        return languageVoices?[key] ?? voice
    }

    mutating func selectModel(_ selected: String) {
        model = selected
        let allowed = Set(provider.voices(for: model).map(\.id))
        if !allowed.contains(voice) { voice = provider.defaultVoice }
        languageVoices = languageVoices?.filter { allowed.contains($0.value) }
    }

    func endpoint() -> URL {
        URL(string: provider.baseURL + (provider == .minimax ? "/t2a_v2" : "/audio/speech"))!
    }

    func validate(requiresToken: Bool = true) throws {
        let credentials = requiresToken || !token.isEmpty ? [token] : []
        for value in [model, voice] + credentials + Array((languageVoices ?? [:]).values) {
            guard !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  value.rangeOfCharacter(from: .controlCharacters) == nil else { throw ModuleError.invalid("请填写有效的语音模型、音色和 API Key") }
        }
        guard model.utf8.count <= 256, voice.utf8.count <= 256, token.utf8.count <= 16384,
              speed.isFinite, (0.5...2).contains(speed) else { throw ModuleError.invalid("语音合成设置无效，语速须为 0.5–2 倍") }
    }

    func request(_ params: [String: Any], streaming: Bool = false) throws -> URLRequest {
        try validate()
        guard let text = params["text"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              text.utf16.count <= 4000 else { throw ModuleError.invalid("朗读文本须为 1–4000 个字符，请将长文章分段生成") }
        let rate: Double
        if let value = params["speed"] {
            guard let number = value as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID(), number.doubleValue.isFinite,
                  (0.5...2).contains(number.doubleValue) else { throw ModuleError.invalid("语音合成设置无效，语速须为 0.5–2 倍") }
            rate = number.doubleValue
        } else { rate = speed }
        var body: [String: Any] = ["model": model.trimmingCharacters(in: .whitespacesAndNewlines)]
        let language: String?
        if let value = params["language"] {
            guard let code = value as? String, code.count <= 63,
                  code.range(of: "^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$", options: .regularExpression) != nil else {
                throw ModuleError.invalid("请选择有效的朗读语言。")
            }
            language = code
        } else { language = nil }
        let selectedVoice: String
        if let override = params["voice"] {
            guard let id = override as? String, provider.voices(for: model).contains(where: { $0.id == id }) else {
                throw ModuleError.invalid("所选音色不可用，请重新选择。")
            }
            selectedVoice = id
        } else {
            selectedVoice = voice(for: language).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        switch provider {
        case .minimax:
            body.merge(["text": text, "stream": false, "output_format": "hex", "language_boost": "auto",
                        "voice_setting": ["voice_id": selectedVoice, "speed": rate, "vol": 1, "pitch": 0],
                        "audio_setting": ["format": "mp3", "sample_rate": 32000, "bitrate": 128000, "channel": 1]]) { _, new in new }
        case .openAICompatible:
            body.merge(["input": text, "voice": selectedVoice, "speed": rate, "response_format": "mp3"]) { _, new in new }
        }
        if streaming {
            if provider == .minimax {
                body["stream"] = true
                body["stream_options"] = ["exclude_aggregated_audio": true]
                body["audio_setting"] = ["format": "pcm", "sample_rate": 24000, "channel": 1]
            } else { body["response_format"] = "pcm" }
        }
        var request = URLRequest(url: endpoint(), timeoutInterval: 120)
        request.httpMethod = "POST"
        request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [.sortedKeys])
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token.trimmingCharacters(in: .whitespacesAndNewlines))", forHTTPHeaderField: "Authorization")
        return request
    }
}

// Credentials remain in the host's Keychain; no bridge method returns them.
enum TTSStore {
    static func save(_ configuration: TTSConfiguration, service: String = "me.stackli.lingrove.host.tts") throws {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: "configuration"]
        let attributes: [String: Any] = [kSecValueData as String: try JSONEncoder().encode(configuration), kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
        var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound { status = SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil) }
        guard status == errSecSuccess else { throw ModuleError.invalid("无法保存语音合成设置（\(status)）") }
    }
    static func load(service: String = "me.stackli.lingrove.host.tts") throws -> TTSConfiguration {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: "configuration", kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { return TTSConfiguration() }
        guard status == errSecSuccess, let data = item as? Data else { throw ModuleError.invalid("无法读取语音合成设置，请解锁设备后重试（\(status)）") }
        return try JSONDecoder().decode(TTSConfiguration.self, from: data)
    }
}

struct TTSAudio {
    let data: Data
    let model: String
    let provider: String
    var bridgeResult: [String: Any] {
        ["audioBase64": data.base64EncodedString(), "mimeType": "audio/mpeg", "model": model, "provider": provider]
    }
}

enum TTSService {
    static let maximumAudioBytes = 8 * 1024 * 1024
    static let maximumResponseBytes = maximumAudioBytes * 2 + 1024 * 1024

    static func synthesize(_ params: [String: Any], configuration: TTSConfiguration, session: URLSession? = nil) async throws -> TTSAudio {
        let request = try configuration.request(params)
        let settings = session?.configuration ?? URLSessionConfiguration.ephemeral
        settings.timeoutIntervalForRequest = 120
        settings.timeoutIntervalForResource = 120
        settings.httpCookieStorage = nil
        settings.httpShouldSetCookies = false
        settings.urlCache = nil
        let connection = URLSession(configuration: settings, delegate: NoRedirect(), delegateQueue: nil)
        defer { connection.invalidateAndCancel() }
        let (bytes, response) = try await connection.bytes(for: request)
        guard let http = response as? HTTPURLResponse else { throw ModuleError.invalid("语音服务响应无效") }
        guard (200..<300).contains(http.statusCode) else { throw ModuleError.invalid("朗读失败，请检查「语音合成」中的设置和可用额度。") }
        guard response.expectedContentLength <= maximumResponseBytes else { throw ModuleError.invalid("语音响应过大，请缩短文本") }
        var data = Data()
        for try await byte in bytes {
            try Task.checkCancellation()
            guard data.count < maximumResponseBytes else { throw ModuleError.invalid("语音响应过大，请缩短文本") }
            data.append(byte)
        }
        try Task.checkCancellation()
        return try decode(data, configuration: configuration)
    }

    static func decodeHex(_ hex: String) throws -> Data {
        guard hex.utf8.count.isMultiple(of: 2) else { throw ModuleError.invalid("语音服务响应无效") }
        var decoded = Data()
        decoded.reserveCapacity(hex.utf8.count / 2)
        var high: UInt8?
        for byte in hex.utf8 {
            let nibble: UInt8
            switch byte {
            case 48...57: nibble = byte - 48
            case 65...70: nibble = byte - 55
            case 97...102: nibble = byte - 87
            default: throw ModuleError.invalid("语音服务响应无效")
            }
            if let previous = high { decoded.append(previous * 16 + nibble); high = nil }
            else { high = nibble }
        }
        return decoded
    }

    static func decode(_ data: Data, configuration: TTSConfiguration) throws -> TTSAudio {
        let audio: Data
        switch configuration.provider {
        case .minimax:
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let base = json["base_resp"] as? [String: Any], let code = base["status_code"] as? Int else { throw ModuleError.invalid("语音服务响应无效") }
            guard code == 0 else { throw ModuleError.invalid("MiniMax 语音生成失败（\(code)），请检查密钥、模型、音色和套餐额度") }
            guard let result = json["data"] as? [String: Any], result["status"] as? Int == 2,
                  let hex = result["audio"] as? String, !hex.isEmpty, hex.utf8.count <= maximumAudioBytes * 2,
                  hex.utf8.count.isMultiple(of: 2) else { throw ModuleError.invalid("语音服务未返回完整音频") }
            audio = try decodeHex(hex)
        case .openAICompatible:
            audio = data
        }
        // Reject JSON/HTML errors and empty payloads even when the HTTP status was 200.
        let prefix = Array(audio.prefix(3))
        let isMP3 = prefix == [0x49, 0x44, 0x33] || (prefix.count >= 2 && prefix[0] == 0xff && prefix[1] & 0xe0 == 0xe0)
        guard !audio.isEmpty, audio.count <= maximumAudioBytes, isMP3 else { throw ModuleError.invalid("语音服务未返回有效的 MP3 音频") }
        return TTSAudio(data: audio, model: configuration.model, provider: configuration.provider.rawValue)
    }
}

enum TTSPreviewSamples {
    // Samples intentionally stay in the language being previewed, independent of the UI locale.
    static let texts: [String: String] = [
        "ja": "こんにちは。今日は日本語の文章を読みましょう。",
        "zh": "你好，欢迎试听。这是一段中文语音示例。",
        "en": "Hello, welcome to this voice preview. This is a sample in English.",
        "el": "Γεια σας. Αυτό είναι ένα δείγμα φωνής στα ελληνικά.",
        "ru": "Здравствуйте. Это образец речи на русском языке.",
    ]

    static func text(for language: String, appLanguage: String = AppLanguage.current) -> String {
        let code = (language.isEmpty ? appLanguage : language).lowercased().split(separator: "-").first.map(String.init) ?? "en"
        return texts[code] ?? texts["en"]!
    }
}

struct TTSSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showingLanguageVoices = false
    @State private var configuration = TTSConfiguration()
    @State private var drafts: [TTSProvider: TTSConfiguration] = [:]
    @State private var loaded = false
    @State private var message = ""
    @State private var sample = TTSPreviewSamples.text(for: "ja")
    @State private var previewTask: Task<Void, Never>?
    @State private var player: TTSPlayback?
    @State private var sampleLanguage = "ja"
    @State private var languageSearch = ""

    var body: some View {
        Form {
            Section {
                Picker("语音服务商", selection: Binding(get: { configuration.provider }, set: { provider in
                    stopPreview()
                    drafts[configuration.provider] = configuration
                    configuration = drafts[provider] ?? .defaults(for: provider)
                    message = ""
                })) {
                    ForEach(TTSProvider.allCases) { provider in Text(LocalizedStringKey(provider.title)).tag(provider) }
                }.accessibilityIdentifier("tts-provider")
                Picker("模型名称", selection: Binding(get: { configuration.model }, set: { model in
                    stopPreview()
                    configuration.selectModel(model)
                })) {
                    ForEach(configuration.provider.models, id: \.self) { model in
                        Text(verbatim: model).tag(model)
                    }
                }.pickerStyle(.menu).accessibilityIdentifier("tts-model").accessibilityValue(configuration.model)
                voicePicker("默认音色", language: nil, id: "tts-voice")
                Button { showingLanguageVoices = true } label: {
                    HStack {
                        Text("按语言设置音色")
                        Spacer()
                        Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                    }.contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityIdentifier("tts-language-voices")
                VStack(alignment: .leading, spacing: 8) {
                    Text("API Key").font(.subheadline).foregroundStyle(.secondary)
                    SecureField("API Key", text: $configuration.token)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityLabel("API Key").accessibilityIdentifier("tts-key")
                }
            } header: { Text("语音合成") } footer: {
                Text("此语音合成设置适用于所有应用。文本将发送给所选服务商，密钥仅安全保存在此设备上。生成语音会消耗服务商额度。")
            }
            Section("默认语速") {
                Slider(value: $configuration.speed, in: 0.5...2, step: 0.1)
                    .accessibilityLabel("默认语速")
                Text(verbatim: String(format: "%.1f×", configuration.speed)).monospacedDigit()
            }
            Section {
                Button("移除 API Key", role: .destructive) {
                    stopPreview()
                    configuration.token = ""
                    drafts.removeAll()
                }

            }
            Section {
                Picker("试听语言", selection: $sampleLanguage) {
                    Text("默认音色").tag("")
                    ForEach(configuration.provider.languages(for: configuration.model), id: \.self) { language in
                        Text(verbatim: languageTitle(language)).tag(language)
                    }
                }.accessibilityIdentifier("tts-preview-language")
                .onChange(of: sampleLanguage) { _, language in
                    stopPreview()
                    sample = TTSPreviewSamples.text(for: language)
                    message = ""
                }
                TextField("试听文本", text: $sample, axis: .vertical).lineLimit(2...5)
                    .accessibilityIdentifier("tts-sample")
                Button(previewTask == nil ? "试听" : "停止播放") {
                    if previewTask != nil { stopPreview(); return }
                    player?.stop(); message = ""
                    let current = configuration
                    let text = sample
                    let language = sampleLanguage
                    previewTask = Task { @MainActor in
                        defer { previewTask = nil }
                        do {
                            let audio = TTSPlayback()
                            player = audio
                            var params: [String: Any] = ["text": text]
                            if !language.isEmpty { params["language"] = language }
                            try await audio.run(params, configuration: current)
                        } catch { if !Task.isCancelled && !(error is CancellationError) { message = error.localizedDescription } }
                    }
                }.accessibilityIdentifier("tts-preview")
                if previewTask != nil {
                    Button("暂停播放") { player?.pause() }
                    Button("继续播放") { player?.resume() }
                }
            } header: { Text("AI 语音试听") }
            if !message.isEmpty { Section { Text(AppLanguage.text(message)).font(.footnote).accessibilityIdentifier("tts-message") } }
        }
        .disabled(!loaded)
        .navigationTitle("语音合成")
        .navigationDestination(isPresented: $showingLanguageVoices) { languageVoicesPage }
        .task {
            guard !loaded else { return }
            do { configuration = try TTSStore.load(); loaded = true }
            catch { message = error.localizedDescription }
        }
        .onChange(of: configuration.model) { _, _ in
            if !configuration.provider.languages(for: configuration.model).contains(sampleLanguage) { sampleLanguage = "" }
        }
        .onChange(of: configuration) { _, _ in message = "" }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { if saveConfiguration() { dismiss() } } label: { Image(systemName: "checkmark") }
                    .accessibilityLabel("保存").disabled(!loaded)
                    .accessibilityIdentifier("tts-save")
            }
        }
        .onDisappear { stopPreview() }
    }
    private func saveConfiguration() -> Bool {
        guard loaded else { return false }
        stopPreview()
        do {
            try configuration.validate(requiresToken: false)
            try TTSStore.save(configuration)
            message = ""
            return true
        } catch { message = error.localizedDescription; return false }
    }
    private func languageTitle(_ code: String) -> String {
        Locale(identifier: AppLanguage.current).localizedString(forIdentifier: code) ?? code
    }
    private var languageVoicesPage: some View {
        List {
            ForEach(configuration.provider.languages(for: configuration.model).filter {
                languageSearch.isEmpty || languageTitle($0).localizedCaseInsensitiveContains(languageSearch) || $0.localizedCaseInsensitiveContains(languageSearch)
            }, id: \.self) { language in
                voicePicker(languageTitle(language), language: language, id: "tts-voice-\(language)")
            }
        }
        .searchable(text: $languageSearch, prompt: "搜索语言")
        .navigationTitle("按语言设置音色")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { if saveConfiguration() { showingLanguageVoices = false } } label: { Image(systemName: "checkmark") }
                    .accessibilityLabel("保存").accessibilityIdentifier("tts-language-save")
            }
        }
        .safeAreaInset(edge: .bottom) {
            if !message.isEmpty {
                Text(AppLanguage.text(message)).font(.footnote).padding()
                    .frame(maxWidth: .infinity).background(.regularMaterial)
            }
        }
        .onAppear { stopPreview() }
        .onDisappear { languageSearch = "" }
    }
    private func voicePicker(_ title: String, language: String?, id: String) -> some View {
        let options = configuration.provider.voiceOptions(for: configuration.model, language: language)
        let selected = language.map { configuration.languageVoices?[$0] ?? "" } ?? configuration.voice
        return Picker(LocalizedStringKey(title), selection: Binding(get: {
            language.map { configuration.languageVoices?[$0] ?? "" } ?? configuration.voice
        }, set: { voice in
            stopPreview()
            message = ""
            if let language {
                var voices = configuration.languageVoices ?? [:]
                if voice.isEmpty { voices.removeValue(forKey: language) } else { voices[language] = voice }
                configuration.languageVoices = voices.isEmpty ? nil : voices
            } else { configuration.voice = voice }
        })) {
            if language != nil { Text("使用默认音色").tag("") }
            ForEach(options) { voice in
                Text(LocalizedStringKey(voice.title)).tag(voice.id)
            }
        }.pickerStyle(.menu).accessibilityIdentifier(id)
            .accessibilityValue(AppLanguage.text(selected.isEmpty ? "使用默认音色" : options.first { $0.id == selected }?.title ?? selected))
    }

    private func stopPreview() {
        previewTask?.cancel()
        // Keep the cancelled task until it finishes so it cannot overwrite a new preview.
        player?.stop(); player = nil
    }
}
