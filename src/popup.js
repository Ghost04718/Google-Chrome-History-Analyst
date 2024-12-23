import Chart from 'chart.js/auto';
import { analyzeHistory } from './ai-service';
import { renderMarkdown } from './markdown';

let currentCharts = {
  activity: null,
  category: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initializeTimeFilter();
  await loadData('year');
  initializeShareButton();
  document.getElementById('loading').style.display = 'none';
});

function initializeTimeFilter() {
  const buttons = document.querySelectorAll('.time-filter button');
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      buttons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      await loadData(button.dataset.period);
    });
  });
}

function initializeShareButton() {
  const shareButton = document.querySelector('.share-button');
  shareButton.addEventListener('click', async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const container = document.querySelector('.container');
      
      // 使用html2canvas捕获内容
      const dataUrl = canvas.toDataURL();
      
      // 创建分享内容
      const shareData = {
        title: 'My Browsing Journey',
        text: 'Check out my browsing patterns and insights!',
        url: dataUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // 回退到复制链接
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      showToast('Unable to share at this moment');
    }
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    animation: fadeInOut 2.5s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

async function loadData(period) {
  const endTime = new Date();
  const startTime = new Date();
  
  switch(period) {
    case 'week':
      startTime.setDate(startTime.getDate() - 7);
      break;
    case 'month':
      startTime.setMonth(startTime.getMonth() - 1);
      break;
    case 'year':
      startTime.setFullYear(startTime.getFullYear() - 1);
      break;
  }

  chrome.history.search({
    text: '',
    startTime: startTime.getTime(),
    endTime: endTime.getTime(),
    maxResults: 20000
  }, async function(historyItems) {
    const processedData = processHistoryData(historyItems);
    updateStats(processedData);
    updateCharts(processedData);
    await updateAIInsights(processedData);
  });
}

function processHistoryData(historyItems) {
  const visitsByTime = new Array(24).fill(0);
  const visitsByDomain = new Map();
  const categories = new Map();
  
  historyItems.forEach(item => {
    const date = new Date(item.lastVisitTime);
    visitsByTime[date.getHours()]++;
    
    const domain = new URL(item.url).hostname;
    visitsByDomain.set(domain, (visitsByDomain.get(domain) || 0) + 1);
    
    // 简单的网站分类逻辑
    const category = categorizeUrl(item.url);
    categories.set(category, (categories.get(category) || 0) + 1);
  });
  
  return {
    visitsByTime,
    visitsByDomain: Array.from(visitsByDomain.entries())
      .sort((a, b) => b[1] - a[1]),
    categories: Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
  };
}

function categorizeUrl(url) {
  const domain = new URL(url).hostname.toLowerCase();
  
  const categories = {
    'Social Media': [
      'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'snapchat.com',
      'tiktok.com', 'reddit.com', 'pinterest.com', 'wechat.com', 'vk.com', 'tumblr.com',
      'line.me', 'flickr.com', 'quora.com', 'medium.com', 'myspace.com', 'ok.ru',
      'discord.com', 'telegram.org', 'whatsapp.com', 'signal.org', 'wire.com',
      'mastodon.social', 'xing.com', 'gab.com', 'parler.com', 'gettr.com', 'truthsocial.com',
      'mewe.com', 'ello.co', 'band.us', 'badoo.com', 'tagged.com', 'hi5.com', 'mixi.jp',
      'kaixin001.com', 'renren.com', 'weibo.com', 'qzone.qq.com', 'douban.com',
      'viber.com', 'imo.im', 'zalo.me', 'kakaotalk.com', 'cyworld.com',
      'odnoklassniki.ru', 'mail.ru/my', 'rambler.ru', 'yandex.ru/blogs', 'draugiem.lv',
      'one.lv', 'habbo.com', 'secondlife.com'
    ],
    'Productivity': [
      'github.com', 'notion.so', 'trello.com', 'slack.com', 'asana.com', 'monday.com',
      'clickup.com', 'evernote.com', 'basecamp.com', 'wrike.com', 'google.com/drive',
      'dropbox.com', 'box.com', 'zoho.com', 'mindmeister.com', 'calm.com',
      'rescuetime.com', 'todoist.com', 'toggl.com', 'clockify.me', 'focusmate.com',
      'any.do', 'ticktick.com', 'microsoft.com/to-do', 'google.com/keep',
      'onenote.com', 'onedrive.live.com', 'microsoft.com/microsoft-teams',
      'xmind.net', 'freemind.sourceforge.net', 'jetbrains.com/space', 'teamwork.com',
      'niftypm.com', 'process.st', 'airtable.com', 'wunderlist.com', 'teuxdeux.com',
      'workflowy.com', 'dynalist.io', 'omnifocus.com', 'thingsapp.com', 'freedom.to',
      'forestapp.cc', 'notability.com', 'goodnotes.com', 'simplenote.com', 'bear.app',
      'standardnotes.org', 'zoho.com/projects', 'podio.com', 'celoxis.com', 'proofhub.com',
      'teamgantt.com', 'smartsheet.com'
    ],
    'Learning': [
      'coursera.org', 'udemy.com', 'edx.org', 'wikipedia.org', 'khanacademy.org',
      'skillshare.com', 'futurelearn.com', 'pluralsight.com', 'duolingo.com',
      'memrise.com', 'lynda.com', 'treehouse.com', 'openlearning.com',
      'academic.oup.com', 'tutoring.com', 'chinesepod.com', 'bbc.co.uk/learning',
      'unacademy.com', 'brilliant.org', 'codecademy.com', 'udacity.com', 'mit.edu',
      'harvard.edu', 'stanford.edu', 'yale.edu', 'ox.ac.uk', 'cam.ac.uk',
      'babbel.com', 'rosettastone.com', 'jstor.org', 'sciencedirect.com',
      'researchgate.net', 'google.scholar.com', 'freecodecamp.org', 'codewars.com',
      'leetcode.com', 'ed.ted.com', 'nationalgeographic.com/education', 'sciencemag.org',
      'nature.com', 'wolframalpha.com', 'projecteuler.net', 'code.org', 'edutopia.org',
      'tes.com', 'teacherspayteachers.com', 'busuu.com', 'italki.com', 'verbling.com',
      'open2study.com', 'openuniversity.co.uk', 'unisa.ac.za', 'indiaeducation.net',
      'byjus.com', 'toppr.com', 'vedantu.com', 'douyu.com', 'huya.com', 'bilibili.com'
    ],
    'Entertainment': [
      'youtube.com', 'netflix.com', 'spotify.com',
      'twitch.tv', 'hulu.com', 'disneyplus.com', 'soundcloud.com', 'vimeo.com',
      'pandora.com', 'deezer.com', 'apple.com/music', 'hbo.com', 'vudu.com',
      'bbc.co.uk/iplayer', 'sbs.com.au', 'rakuten.tv', 'youtube.com/music',
      'mubi.com', 'crunchyroll.com', 'playstation.com', 'xbox.com', 'tubi.tv',
      'bilibili.com', 'dailymotion.com', 'funimation.com', 'hulu.jp', 'hotstar.com',
      'primevideo.com', 'hbomax.com', 'peacocktv.com', 'paramountplus.com',
      'tidal.com', 'bandcamp.com', 'mixer.com', 'ign.com', 'gamespot.com', 'metacritic.com',
      'imdb.com', 'rottentomatoes.com', 'allmusic.com', 'last.fm', '8tracks.com', 'plex.tv',
      'iqiyi.com', 'youku.com', 'tudou.com', 'letv.com', 'qq.com/video', 'sohu.com/tv',
      'pptv.com', 'le.com', 'nicovideo.jp', 'gree.jp', 'mobage.jp', 'dmm.com',
      'afreecatv.com', 'daum.net/tvpot', 'naver.com/v', 'ok.ru/video', 'mail.ru/video',
      'rutube.ru', 'ivi.ru', 'kinopoisk.ru', 'megogo.net', 'filmix.net', 'zona.ru',
      'ex.ua', 'fs.to', 'kinogo.club', 'hdrezka.ag', 'lostfilm.tv', 'amediateka.ru',
      'start.ru', 'more.tv', 'premier.one', 'wink.rt.ru', 'mts.tv', 'tricolor.tv',
      'ntvplus.ru', 'tele2tv.ru', 'beeline.tv', 'megafon.tv'
    ],
    'News': [
      'cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'reuters.com',
      'aljazeera.com', 'forbes.com', 'wsj.com', 'foxnews.com', 'theverge.com',
      'bloomberg.com', 'thehindu.com', 'lemonde.fr', 'spiegel.de', 'elpais.com',
      'timesofindia.indiatimes.com', 'straitstimes.com', 'chinadaily.com.cn',
      'rt.com', 'dw.com', 'bbc.co.uk/news', 'news.com.au', 'npr.org', 'usatoday.com',
      'latimes.com', 'nbcnews.com', 'cbsnews.com', 'abcnews.go.com',
      'news.ycombinator.com', 'techcrunch.com', 'wired.com', 'mashable.com',
      'apnews.com', 'politico.com', 'axios.com', 'recode.net', 'buzzfeednews.com',
      'theintercept.com', 'propublica.org', 'foreignaffairs.com', 'economist.com',
      'time.com', 'slate.com', 'salon.com', 'motherjones.com', 'huffpost.com',
      'drudgereport.com', 'breitbart.com', 'infowars.com', 'news.google.com', 'flipboard.com',
      'eluniversal.com.mx', 'jornada.unam.mx', 'clarin.com', 'lanacion.com.ar',
      'oglobo.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'elpais.com.uy',
      'elcomercio.pe', 'larepublica.pe', 'eltiempo.com', 'elespectador.com',
      'latercera.com', 'emol.com', 'elmostrador.cl', 'biobiochile.cl', 'publimetro.cl',
      'ahoranoticias.cl', '24horas.cl', 'chvnoticias.cl', 't13.cl', 'mega.cl',
      'cnnchile.com', 'adnradio.cl', 'cooperativa.cl', 'radioagricultura.cl', 'dfmas.cl',
      'pulso.cl', 'diarioconcepcion.cl', 'elsur.cl', 'soychile.cl', 'eldiario.es',
      'publico.es', 'lavanguardia.com', 'abc.es', 'larazon.es', 'elconfidencial.com',
      'infolibre.es', 'elespanol.com', 'vozpopuli.com', 'okdiario.com',
      'periodistadigital.com', 'elplural.com', 'cuartopoder.es', 'lamarea.com',
      'ctxt.es', 'eldiario.ar', 'pagina12.com.ar', 'infobae.com'
    ]
  };
  
  for (const [category, domains] of Object.entries(categories)) {
    if (domains.some(d => domain.includes(d))) {
      return category;
    }
  }
  
  return 'Other';
}

function updateStats(data) {
  const totalVisits = data.visitsByDomain.reduce((acc, [_, count]) => acc + count, 0);
  const mostActiveHour = data.visitsByTime.indexOf(Math.max(...data.visitsByTime));
  
  document.getElementById('total-visits').textContent = totalVisits.toLocaleString();
  document.getElementById('most-active-day').textContent = `${mostActiveHour}:00`;
  
  // 计算生产力分数
  const productivityScore = calculateProductivityScore(data);
  document.getElementById('productivity-score').textContent = `${productivityScore}%`;
  
  // 计算学习时间
  const learningHours = calculateLearningHours(data);
  document.getElementById('learning-hours').textContent = `${learningHours}h`;
}

function calculateProductivityScore(data) {
  const productiveCategories = ['Productivity', 'Learning'];
  const totalVisits = data.categories.reduce((acc, [_, count]) => acc + count, 0);
  const productiveVisits = data.categories
    .filter(([category]) => productiveCategories.includes(category))
    .reduce((acc, [_, count]) => acc + count, 0);
  
  return Math.round((productiveVisits / totalVisits) * 100);
}

function calculateLearningHours(data) {
  const learningVisits = data.categories
    .find(([category]) => category === 'Learning');
  
  return learningVisits ? Math.round(learningVisits[1] * 0.1) : 0; // 假设每次访问平均10分钟
}

function updateCharts(data) {
  updateActivityChart(data);
  updateCategoryChart(data);
}

function updateActivityChart(data) {
  const ctx = document.getElementById('activity-chart').getContext('2d');
  
  if (currentCharts.activity) {
    currentCharts.activity.destroy();
  }
  
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
  
  currentCharts.activity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Activity',
        data: data.visitsByTime,
        fill: true,
        borderColor: '#6366f1',
        backgroundColor: gradient,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Daily Activity Pattern',
          font: {
            family: 'Poppins',
            size: 16,
            weight: '500'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animations: {
        tension: {
          duration: 1000,
          easing: 'easeInOutCubic'
        }
      }
    }
  });
}

function updateCategoryChart(data) {
  const ctx = document.getElementById('category-chart').getContext('2d');
  
  if (currentCharts.category) {
    currentCharts.category.destroy();
  }
  
  const categoryData = data.categories.slice(0, 5);
  
  currentCharts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categoryData.map(([category]) => category),
      datasets: [{
        data: categoryData.map(([_, count]) => count),
        backgroundColor: [
          '#6366f1',
          '#8b5cf6',
          '#d946ef',
          '#ec4899',
          '#f43f5e'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              family: 'Inter',
              size: 12
            },
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Top Categories',
          font: {
            family: 'Poppins',
            size: 16,
            weight: '500'
          }
        }
      },
      cutout: '60%',
      animations: {
        animateRotate: true,
        animateScale: true
      }
    }
  });
}

async function updateAIInsights(data) {
  const aiAnalysis = await analyzeHistory(data);
  const formattedAnalysis = renderMarkdown(aiAnalysis);
  document.getElementById('ai-analysis').innerHTML = formattedAnalysis;
  
  // 添加渐入动画
  const insightsElement = document.getElementById('ai-analysis');
  insightsElement.style.opacity = '0';
  insightsElement.style.transform = 'translateY(20px)';
  insightsElement.style.transition = 'all 0.5s ease';
  
  setTimeout(() => {
    insightsElement.style.opacity = '1';
    insightsElement.style.transform = 'translateY(0)';
  }, 100);
}