const puppeteer = require('puppeteer');
const translate = require('google-translate-api');
const moment = require('moment');
require('moment-countdown');
const YQL = require('yql');
const fetch = require('node-fetch');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('https://s.team/chat');
    try {
        await page.type('#steamAccountName', '');
        await page.type('#steamPassword', '');
        await page.click('#SteamLogin');
        await page.waitForNavigation();
    } catch(ex) {
        console.log('login: ', ex.message);
    }

    const sendChat = async (message) => {
        return new Promise(async (resolve) => {
            if (!message || !message.length) {
                return;
            }
            console.log('sendChat: ', message);

            const lines = message.split('\n');
            for (let i = 0; i < lines.length; i++) {
                await page.type('.chatTextarea', lines[i]);

                if (i < (lines.length - 1)) {
                    await page.keyboard.down('Shift');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Shift');
                }
            }
            await page.keyboard.press('Enter');
            resolve();
        });
    };

    await page.exposeFunction('sendChat', async (message) => {
        await sendChat(message);
    });

    await page.exposeFunction('parseChat', async (message, poster) => {
        message = message.toLowerCase();
        console.log('message: ', `'${message}'`);

        if (message === 'shufflebot quit') {
            await sendChat(`Quitting. Meow!`);
            browser.close();
            return;
        }

        if (message === 'shufflebot help') {
            await sendChat(
`/pre shufflebot <command>
Commands:
roll [0-100 | 100]
weather [in|for] <city>
forecast [in|for] <city>
translate <text> <into|to|in> <language>`
);
            return;
        }

        if (message === 'shufflebot story' || message === 'shufflebot stories') {
            await sendChat(`No! That's not how it works!`);
            return;
        }

        if (message === 'owo' || message === 'uwu') {
            await sendChat('What\'s this!');
            return;
        }

        if (message.startsWith('shaking chen') || message.startsWith('shakingchen')) {
            await sendChat('https://steamusercontent-a.akamaihd.net/ugc/985611585365185069/952AC34A93F888857A14CC0A84D70596BDDEF91E/');
            return;
        }

        if (message.startsWith('monhun when')) {
            const monhunTime = new Date('2018-08-09T16:00:00Z');

            if (new Date() > monhunTime) {
                return;
            }

            const countdown = moment(monhunTime).countdown().toString();
            await sendChat(`in ${countdown}`);
            return;
        }

        if (message.startsWith('shufflebot roll')) {
            const rex = /roll (\d+)(?:-(\d+))?$/i;
            let match = rex.exec(message);

            let rollStart = 0;
            let rollEnd = 100;

            if (match !== null) {
                rollEnd = parseInt(match[1]);

                if (match[2] != null) {
                    rollStart = rollEnd;
                    rollEnd = parseInt(match[2]);
                }
            } else if (message !== 'shufflebot roll') {
                return;
            }

            const number = Math.floor(Math.random() * rollEnd) + rollStart;
            await sendChat(`${poster} rolled ${number}`);
            return;
        }

        if (message.startsWith('shufflebot translate')) {
            console.log('translation attempt');
            const rex = /shufflebot translate (.*?)(?: (?:into|to|in)? (\w+?))?$/i;
            let match = rex.exec(message);

            if (match === null) {
                return;
            }

            const languages = { 'afrikaans': 'af', 'albanian': 'sq', 'amharic': 'am', 'arabic': 'ar', 'armenian': 'hy', 'azerbaijani': 'az', 'basque': 'eu', 'belarusian': 'be', 'bengali': 'bn', 'bosnian': 'bs', 'bulgarian': 'bg', 'catalan': 'ca', 'cebuano': 'ceb', 'chichewa': 'ny', 'chinese': 'zh-cn', 'corsican': 'co', 'croatian': 'hr', 'czech': 'cs', 'danish': 'da', 'dutch': 'nl', 'english': 'en', 'esperanto': 'eo', 'estonian': 'et', 'filipino': 'tl', 'finnish': 'fi', 'french': 'fr', 'frisian': 'fy', 'galician': 'gl', 'georgian': 'ka', 'german': 'de', 'greek': 'el', 'gujarati': 'gu', 'haitian': 'ht', 'hausa': 'ha', 'hawaiian': 'haw', 'hebrew': 'iw', 'hindi': 'hi', 'hmong': 'hmn', 'hungarian': 'hu', 'icelandic': 'is', 'igbo': 'ig', 'indonesian': 'id', 'irish': 'ga', 'italian': 'it', 'japanese': 'ja', 'javanese': 'jw', 'kannada': 'kn', 'kazakh': 'kk', 'khmer': 'km', 'korean': 'ko', 'kurdish': 'ku', 'kyrgyz': 'ky', 'lao': 'lo', 'latin': 'la', 'latvian': 'lv', 'lithuanian': 'lt', 'luxembourgish': 'lb', 'macedonian': 'mk', 'malagasy': 'mg', 'malay': 'ms', 'malayalam': 'ml', 'maltese': 'mt', 'maori': 'mi', 'marathi': 'mr', 'mongolian': 'mn', 'myanmar': 'my', 'nepali': 'ne', 'norwegian': 'no', 'pashto': 'ps', 'persian': 'fa', 'polish': 'pl', 'portuguese': 'pt', 'punjabi': 'ma', 'romanian': 'ro', 'russian': 'ru', 'samoan': 'sm', 'gaelic': 'gd', 'serbian': 'sr', 'sesotho': 'st', 'shona': 'sn', 'sindhi': 'sd', 'sinhala': 'si', 'slovak': 'sk', 'slovenian': 'sl', 'somali': 'so', 'spanish': 'es', 'sundanese': 'su', 'swahili': 'sw', 'swedish': 'sv', 'tajik': 'tg', 'tamil': 'ta', 'telugu': 'te', 'thai': 'th', 'turkish': 'tr', 'ukrainian': 'uk', 'urdu': 'ur', 'uzbek': 'uz', 'vietnamese': 'vi', 'welsh': 'cy', 'xhosa': 'xh', 'yiddish': 'yi', 'yoruba': 'yo', 'zulu': 'zu' };

            let targetLanguage = 'en';
            if (match[2]) {
                if (!languages[match[2]]) {
                    await sendChat(`I don't know ${match[2]}`);
                    return;
                }

                targetLanguage = languages[match[2]];
            }
            console.log(`translate '${match[1]}' into '${targetLanguage}'`);

            try {
                const translation = await translate(match[1], { to: targetLanguage });
                if (translation && translation.text) {
                    await sendChat(translation.text);
                }
            } catch(ex) {
                console.log('translation error: ', ex.message);
            }

            return;
        }

        if (message.startsWith('shufflebot forecast')) {
            console.log('forecast attempt');
            const rex = /shufflebot forecast (?:(?:in|for) )?(.*?)$/i;
            let match = rex.exec(message);

            if (match === null || !match[1]) {
                return;
            }
            const city = match[1];
            console.log('querying forecast for: ', city);
            try {
                const query = new YQL(
                    `select location, item.forecast from weather.forecast where u = 'c' and woeid in (select woeid from geo.places(1) where text='${city}')`
                    , { ssl: true }
                );

                query.exec(async (err, data) => {
                    try {
                        const query = data.query;
                        if (query.count && query.results) {
                            const location = query.results.channel[0].location;
                            const forecasts = [];
                            if (query.results.channel.length > 4) {
                                query.results.channel.length = 4;
                            }
                            let lengthText = 0;
                            query.results.channel.forEach(fc => {
                                if (fc.item.forecast.text.length > lengthText) {
                                    lengthText = fc.item.forecast.text.length;
                                }
                            });
                            query.results.channel.forEach(fc => {
                                const item = fc.item.forecast;
                                const padding = ''.padEnd(lengthText - item.text.length);
                                forecasts.push(`${moment(new Date(item.date)).format('ddd DD MMM')}: ${item.text},${padding} temp. ${item.high}C hi / ${item.low}C lo`);
                            });
                            await sendChat(`forecast for ${location.city}, ${location.country}`);
                            await sendChat(`/pre ${forecasts.join('\n')}`);
                        }
                        else {
                            await sendChat(`I cannot find ${city}`);
                        }
                    } catch(exy) {
                        console.log('forecast exec error: ', exy.message);
                    }
                });
            } catch(ex) {
                console.log('forecast error: ', ex.message);
            }

            return;
        }

        if (message.startsWith('shufflebot weather')) {
            console.log('weather attempt');
            const rex = /shufflebot weather (?:(?:in|for) )?(.*?)$/i;
            let match = rex.exec(message);

            if (match === null || !match[1]) {
                return;
            }
            const city = match[1];
            console.log('querying weather for: ', city);
            try {
                const query = new YQL(
                    `select location, item.condition, atmosphere from weather.forecast where u = 'c' and woeid in (select woeid from geo.places(1) where text='${city}')`
                    , { ssl: true }
                );

                query.exec(async (err, data) => {
                    try {
                        const query = data.query;
                        if (query.count && query.results) {
                            if (city === 'vienna') {
                                console.log('weather: trying zamg');
                                const zamgpage = await fetch('https://www.zamg.ac.at/cms/de/wetter/wetterwerte-analysen/wien').then(res => res.text());
                                const zamgrex = /<td class="text_right wert selected">(.*?)&deg;<\/td><td class="text_center wert ">(.*?) %<\/td>/mi;
                                const zamgmatch = zamgrex.exec(zamgpage);
                                console.log('weather: zamg object: ', JSON.stringify(zamgmatch));

                                if (zamgmatch) {
                                    if (zamgmatch[1]) {
                                        query.results.channel.item.condition.temp = parseFloat(zamgmatch[1]);
                                    }
                                    if (zamgmatch[2]) {
                                        query.results.channel.atmosphere.humidity = parseInt(zamgmatch[2]);
                                    }
                                }
                            }

                            await sendChat(`weather in ${query.results.channel.location.city}, ${query.results.channel.location.country} is ${query.results.channel.item.condition.text.toLowerCase()} at ${query.results.channel.item.condition.temp}C with ${query.results.channel.atmosphere.humidity}% humidity`);
                        }
                        else {
                            await sendChat(`I cannot find ${city}`);
                        }
                    } catch(exy) {
                        console.log('weather exec error: ', exy.message);
                    }
                });
            } catch(ex) {
                console.log('weather error: ', ex.message);
            }

            return;
        }

        words = message.split(/\s+|\./);
        if (words.includes('shufflebot')) {
            await sendChat(`That's me! You can ask for help (shufflebot help) to make me tell you what I can do. Meow!`);
            return;
        }
    });

    await (await page.waitForSelector('.friendlist .statusAndName .ContextMenuButton')).click();
    await (await page.waitForSelector('.friendsContextMenu .contextMenuItem:nth-child(3)')).click();
    await (await page.waitForSelector('.ChatRoomList .ChatRoomListGroupItem:first-child > div')).click();

    await page.waitForSelector('.chatHistory');
    const chatResponses = page.evaluate(async () => {
        return new Promise(resolve => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        let elem = null;
                        if (node.classList.contains('ChatMessageBlock')) {
                            elem = node.querySelector('.msg:not(.isCurrentUser) .msgText');
                        } else if (node.classList.contains('msg') && !node.classList.contains('isCurrentUser')) {
                            elem = node.querySelector('.msgText');
                        }

                        if (elem) {
                            const block = elem.closest('.ChatMessageBlock');
                            const nameElem = block.querySelector('.speakerName');
                            const name = nameElem.textContent;
                            window.parseChat(elem.textContent, name);
                        }
                    });
                });
            });

            setTimeout(() => {
                observer.observe(document.querySelector('.chatHistory'), { childList: true, subtree: true });
            }, 2000);
        });
    });

    page.evaluate(async () => {
        return new Promise(resolve => {
            const memberStatus = {};
            window.setTimeout(() => {
                document.querySelectorAll('.ChatRoomMemberScrollList_List .friend').forEach(member => {
                    const name = member.querySelector('.playerName').textContent;
                    const gameName = member.querySelector('.gameName').textContent;
                    const user = { status: !member.classList.contains('offline') };
                    if (member.classList.contains('ingame')) {
                        user.game = gameName;
                    }
                    console.log(`adding user ${name}: `, JSON.stringify(user));
                    memberStatus[name] = user;
                });

                const observer = new MutationObserver(async (mutations) => {
                    mutations.forEach(async (mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const member = mutation.target;
                            const name = member.querySelector('.playerName').textContent;

                            if (name === 'ShuffleBot') {
                                return;
                            }

                            const user = memberStatus[name];
                            console.log(`user ${name} before change: `, JSON.stringify(user));

                            const newStatus = !member.classList.contains('offline');

                            if (newStatus) {
                                const gameName = member.querySelector('.gameName').textContent;
                                user.game = member.classList.contains('ingame') ? gameName : null;
                            }

                            if (newStatus !== user.status && !user.game) {
                                await window.sendChat(`/me - ${name} is now ${newStatus ? 'online' : 'offline'}`);
                            }
                            user.status = newStatus;
                            console.log(`user ${name} after change: `, JSON.stringify(user));
                        }
                    });
                });

                observer.observe(document.querySelector('.ChatRoomMemberScrollList_List'), { childList: true, subtree: true, attributes: true });
            }, 2000);
        });
    });


    await chatResponses;
    browser.close();
})()


