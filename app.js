  const ASSET_BASE = '.';


  const API_URL =
    'https://script.google.com/macros/s/AKfycbyDfL8jtnT0WnyGGC2-0LgCVL8k2NPzTqtGHi14lbDFKOxbuN7J45HAzKtHoutvVTx_DQ/exec';

  let apiCallbackCounter = 0;


  function requestApi(
    api,
    params,
    successHandler,
    failureHandler
  ) {
    apiCallbackCounter += 1;

    const callbackName =
      '__archeroApiCallback_' +
      apiCallbackCounter;

    const query = new URLSearchParams();

    query.set('api', api);
    query.set('callback', callbackName);
    query.set('cacheBust', Date.now());

    Object.keys(params || {})
      .forEach(function(key) {
        const value = params[key];

        if (
          value !== undefined &&
          value !== null &&
          value !== ''
        ) {
          query.set(key, value);
        }
      });

    const script =
      document.createElement('script');

    let finished = false;
    let timeoutId = null;

    const cleanup = function() {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }
    };

    const fail = function(error) {
      if (finished) {
        return;
      }

      finished = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      cleanup();

      if (failureHandler) {
        failureHandler(
          error instanceof Error
            ? error
            : new Error(String(error))
        );
      }
    };

    window[callbackName] = function(payload) {
      if (finished) {
        return;
      }

      if (!payload || payload.ok !== true) {
        fail(
          new Error(
            payload && payload.error
              ? payload.error
              : 'The data request failed.'
          )
        );
        return;
      }

      finished = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      cleanup();

      if (successHandler) {
        successHandler(payload.data);
      }
    };

    script.onerror = function() {
      fail(
        new Error(
          'Could not reach the stats backend.'
        )
      );
    };

    script.src =
      API_URL +
      '?' +
      query.toString();

    timeoutId =
      window.setTimeout(
        function() {
          fail(
            new Error(
              'The stats request timed out.'
            )
          );
        },
        30000
      );

    document.head.appendChild(script);
  }

  const BOSS_IMAGES = {
    TK: `${ASSET_BASE}/TKborder.png`,
    FD: `${ASSET_BASE}/FDborder.png`,
    FDe: `${ASSET_BASE}/FDEborder.png`,
    Snek: `${ASSET_BASE}/SNborder.png`,
    SG: `${ASSET_BASE}/SGborder.png`,
    CM: `${ASSET_BASE}/CMborder.png`,
    SM: `${ASSET_BASE}/SMborder.png`
  };

  const BOSS_META = {
    ALL: {
      code: 'ALL',
      name: 'All Bosses',
      accent: '#8d63ff',
      soft: 'rgba(141, 99, 255, 0.18)',
      glow: 'rgba(141, 99, 255, 0.32)',
      surface: 'rgba(141, 99, 255, 0.09)'
    },

    TK: {
      code: 'TK',
      name: 'Tomb Keeper',
      accent: '#419cff',
      soft: 'rgba(65, 156, 255, 0.17)',
      glow: 'rgba(65, 156, 255, 0.30)',
      surface: 'rgba(65, 156, 255, 0.085)'
    },

    FD: {
      code: 'FD',
      name: 'Flame Dragon',
      accent: '#ff5364',
      soft: 'rgba(255, 83, 100, 0.17)',
      glow: 'rgba(255, 70, 86, 0.30)',
      surface: 'rgba(255, 70, 86, 0.085)'
    },

    FDe: {
      code: 'FDe',
      name: 'Flame Demon',
      accent: '#ff9d42',
      soft: 'rgba(255, 157, 66, 0.17)',
      glow: 'rgba(255, 139, 47, 0.30)',
      surface: 'rgba(255, 139, 47, 0.085)'
    },

    Snek: {
      code: 'Snek',
      name: 'Snake',
      accent: '#58d47e',
      soft: 'rgba(88, 212, 126, 0.17)',
      glow: 'rgba(70, 205, 111, 0.30)',
      surface: 'rgba(70, 205, 111, 0.085)'
    },

    SG: {
      code: 'SG',
      name: 'Stone Golem',
      accent: '#aeb3bf',
      soft: 'rgba(174, 179, 191, 0.17)',
      glow: 'rgba(157, 163, 177, 0.28)',
      surface: 'rgba(157, 163, 177, 0.08)'
    },

    CM: {
      code: 'CM',
      name: 'Cyclops Mage',
      accent: '#ff70d7',
      soft: 'rgba(255, 112, 215, 0.17)',
      glow: 'rgba(255, 83, 207, 0.30)',
      surface: 'rgba(255, 83, 207, 0.085)'
    },

    SM: {
      code: 'SM',
      name: 'Scythe Mage',
      accent: '#9b6cff',
      soft: 'rgba(155, 108, 255, 0.17)',
      glow: 'rgba(137, 85, 255, 0.30)',
      surface: 'rgba(137, 85, 255, 0.085)'
    }
  };

  let currentView = 'home';
  let currentBossCode = 'TK';

  let homepageData = null;
  let progressData = null;
  let recordsData = null;

  const bossPageCache = {};

  let activeHomeBossCode = 'TK';
  let bossCarouselFrame = null;

  document.addEventListener(
    'DOMContentLoaded',
    initialiseApp
  );


  function initialiseApp() {
    document
      .getElementById('bossSelect')
      .addEventListener(
        'change',
        function(event) {
          loadBossPage(
            event.target.value
          );
        }
      );

    const carousel =
      document.getElementById(
        'homeBossCarousel'
      );

    if (carousel) {
      carousel.addEventListener(
        'scroll',
        handleHomeBossCarouselScroll,
        { passive: true }
      );
    }

    document.addEventListener(
      'keydown',
      function(event) {
        if (event.key === 'Escape') {
          closeStreakModal();
        }
      }
    );

    loadHomePage();
  }


  /**
   * ==========================================================
   * HOME
   * ==========================================================
   */

  function loadHomePage() {
    showLoading();

    requestApi(
      'home',
      {},
      function(data) {
        homepageData = data;

        renderHomePage(data);
        showHomeView(false);
        hideLoading();

        requestAnimationFrame(
          function() {
            renderDprChart(
              data.lastSeven || []
            );
          }
        );
      },
      showError
    );
  }


  function renderHomePage(data) {
    renderIdentity(data.identity);
    renderBossPerformance(data.bossPerformance);
    renderLastFour(data.lastFour);
    renderYesterdayCard(data.yesterday);
    renderAverages(data.averages);
    renderLastSeven(data.lastSeven);
    renderStreaks(data.streaks);
    renderRecords(data.records);

    activeHomeBossCode =
      data.identity.todaysBossCode ||
      'TK';

    resetHomeBossCarousel();
    applyBossTheme(activeHomeBossCode);
  }


  function renderIdentity(identity) {
    setText(
      'playerName',
      capitalize(identity.player)
    );

    setText(
      'guildName',
      identity.guild
    );

    setText(
      'todayBossName',
      identity.todaysBoss
    );

    setText(
      'updatedText',
      identity.currentRunTimestamp
        ? (
            'Data updated ' +
            identity.currentRunTimestamp
          )
        : ''
    );

    renderTodayBossVisual(
      identity.todaysBossCode,
      identity.todaysBoss
    );
  }


  function renderTodayBossVisual(
    code,
    bossName
  ) {
    const image =
      document.getElementById(
        'todayBossImage'
      );

    const fallback =
      document.getElementById(
        'todayBossFallback'
      );

    fallback.textContent =
      code || '?';

    fallback.title =
      bossName || code || '';

    showBossCodeFallback(
      image,
      fallback
    );

    const imageUrl =
      getBossImage(code);

    if (!imageUrl) {
      return;
    }

    image.alt =
      bossName || code || '';

    image.onload = function() {
      image.classList.remove('hidden');
      fallback.classList.add('hidden');
    };

    image.onerror = function() {
      showBossCodeFallback(
        image,
        fallback
      );
    };

    image.src = imageUrl;
  }


  function renderYesterdayCard(data) {
    const name =
      document.getElementById(
        'yesterdayBossName'
      );

    const date =
      document.getElementById(
        'yesterdayBossDate'
      );

    const visual =
      document.getElementById(
        'yesterdayBossVisual'
      );

    const grid =
      document.getElementById(
        'yesterdayPerformanceGrid'
      );

    if (!data) {
      name.textContent = 'No result yet';
      date.textContent = '';
      visual.innerHTML = '';
      grid.innerHTML = '';
      return;
    }

    name.textContent = data.boss || '';
    date.textContent = data.date || '';

    visual.innerHTML = '';
    visual.appendChild(
      createBossVisual(
        data.code,
        data.boss
      )
    );

    grid.innerHTML = '';

    grid.appendChild(
      createYesterdayMetricCard(
        'Result',
        data.result.damage,
        data.result.dpr,
        data.result.damageRank,
        data.result.dprRank,
        '',
        ''
      )
    );

    grid.appendChild(
      createYesterdayMetricCard(
        'Previous 4 Avg',
        data.previousFour.damage,
        data.previousFour.dpr,
        '',
        '',
        formatYesterdayDelta(
          data.changeFromAverage.damage,
          'damage',
          'vs avg'
        ),
        formatYesterdayDelta(
          data.changeFromAverage.dpr,
          'dpr',
          'vs avg'
        )
      )
    );

    grid.appendChild(
      createYesterdayMetricCard(
        'PB Before Run',
        data.personalBestBefore.damage,
        data.personalBestBefore.dpr,
        '',
        '',
        formatYesterdayPbDelta(
          data.changeFromPb.damage,
          'damage'
        ),
        formatYesterdayPbDelta(
          data.changeFromPb.dpr,
          'dpr'
        )
      )
    );
  }


  function createYesterdayMetricCard(
    label,
    damage,
    dpr,
    damageRank,
    dprRank,
    damageNote,
    dprNote
  ) {
    const card =
      document.createElement('article');

    card.className =
      'performance-column yesterday-performance-column';

    card.innerHTML = `
      <p class="performance-label">
        ${escapeHtml(label)}
      </p>

      <div class="metric-pair">
        <p class="metric-name">Damage</p>
        <p class="metric-value">
          ${formatDamage(damage)}
          ${formatRankHtml(damageRank)}
        </p>
        ${damageNote}
      </div>

      <div class="metric-pair">
        <p class="metric-name">DPR</p>
        <p class="metric-value">
          ${formatDpr(dpr)}
          ${formatRankHtml(dprRank)}
        </p>
        ${dprNote}
      </div>
    `;

    return card;
  }


  function formatYesterdayDelta(
    value,
    type,
    suffix
  ) {
    const numeric = parseNumeric(value);

    if (!Number.isFinite(numeric)) {
      return '';
    }

    const className =
      numeric > 0
        ? 'difference-positive'
        : numeric < 0
          ? 'difference-negative'
          : 'difference-neutral';

    const text =
      type === 'damage'
        ? formatSignedDamage(numeric)
        : formatSignedDpr(numeric);

    return (
      '<p class="yesterday-delta ' +
      className +
      '">' +
      escapeHtml(text + ' ' + suffix) +
      '</p>'
    );
  }


  function formatYesterdayPbDelta(
    value,
    type
  ) {
    const numeric = parseNumeric(value);

    if (!Number.isFinite(numeric)) {
      return '';
    }

    const suffix =
      numeric > 0
        ? 'PB gain'
        : numeric < 0
          ? 'to PB'
          : 'matched PB';

    return formatYesterdayDelta(
      numeric,
      type,
      suffix
    );
  }


  function resetHomeBossCarousel() {
    const carousel =
      document.getElementById(
        'homeBossCarousel'
      );

    if (!carousel) {
      return;
    }

    carousel.scrollLeft = 0;
    updateHomeBossCarouselState(0);
  }


  function handleHomeBossCarouselScroll() {
    if (bossCarouselFrame !== null) {
      cancelAnimationFrame(
        bossCarouselFrame
      );
    }

    bossCarouselFrame =
      requestAnimationFrame(
        function() {
          const carousel =
            document.getElementById(
              'homeBossCarousel'
            );

          if (!carousel) {
            return;
          }

          const width =
            carousel.clientWidth || 1;

          const index =
            Math.max(
              0,
              Math.min(
                1,
                Math.round(
                  carousel.scrollLeft /
                  width
                )
              )
            );

          updateHomeBossCarouselState(
            index
          );
        }
      );
  }


  function updateHomeBossCarouselState(index) {
    const todayDot =
      document.getElementById(
        'todayCarouselDot'
      );

    const yesterdayDot =
      document.getElementById(
        'yesterdayCarouselDot'
      );

    if (todayDot) {
      todayDot.classList.toggle(
        'active',
        index === 0
      );
    }

    if (yesterdayDot) {
      yesterdayDot.classList.toggle(
        'active',
        index === 1
      );
    }

    if (!homepageData) {
      return;
    }

    const code =
      index === 1 &&
      homepageData.yesterday
        ? homepageData.yesterday.code
        : homepageData
            .identity
            .todaysBossCode;

    activeHomeBossCode =
      code || 'TK';

    if (currentView === 'home') {
      applyBossTheme(
        activeHomeBossCode
      );
    }
  }


  function showBossCodeFallback(
    image,
    fallback
  ) {
    image.classList.add('hidden');
    fallback.classList.remove('hidden');
  }


  function renderBossPerformance(rows) {
    const container =
      document.getElementById(
        'bossPerformanceGrid'
      );

    container.innerHTML = '';

    rows.forEach(function(row) {
      const card =
        document.createElement('article');

      card.className =
        'performance-column';

      card.innerHTML = `
        <p class="performance-label">
          ${escapeHtml(row.metric)}
        </p>

        <div class="metric-pair">
          <p class="metric-name">
            Damage
          </p>

          <p class="metric-value">
            ${formatDamage(row.damage)}
            ${formatRankHtml(row.damageRank)}
          </p>
        </div>

        <div class="metric-pair">
          <p class="metric-name">
            DPR
          </p>

          <p class="metric-value">
            ${formatDpr(row.dpr)}
            ${formatRankHtml(row.dprRank)}
          </p>
        </div>
      `;

      container.appendChild(card);
    });
  }


  function renderLastFour(rows) {
    const container =
      document.getElementById(
        'lastFourAttempts'
      );

    container.innerHTML = '';

    rows.forEach(function(row) {
      const item =
        document.createElement('div');

      item.className = 'attempt-row';

      item.innerHTML = `
        <div>
          <strong>
            ${escapeHtml(compactDate(row.date))}
          </strong>

          <span>Attempt</span>
        </div>

        <div>
          <strong>
            ${formatDamage(row.damage)}
            ${formatRankHtml(row.damageRank)}
          </strong>

          <span>Damage</span>
        </div>

        <div>
          <strong>
            ${formatDpr(row.dpr)}
            ${formatRankHtml(row.dprRank)}
          </strong>

          <span>DPR</span>
        </div>
      `;

      container.appendChild(item);
    });
  }


  function renderAverages(rows) {
    const container =
      document.getElementById(
        'averagesGrid'
      );

    container.innerHTML = '';

    rows.forEach(function(row) {
      const difference =
        parseNumeric(row.difference);

      const differenceClass =
        difference > 0
          ? 'difference-positive'
          : difference < 0
            ? 'difference-negative'
            : 'difference-neutral';

      const differenceText =
        difference > 0
          ? (
              '+' +
              formatDpr(row.difference)
            )
          : formatDpr(row.difference);

      const card =
        document.createElement('article');

      card.className =
        'average-card';

      card.innerHTML = `
        <p class="average-label">
          ${escapeHtml(
            row.metric.replace(' DPR', '')
          )}
        </p>

        <p class="average-value">
          ${formatDpr(row.current)}
        </p>

        <p class="average-comparison">
          Last week ${formatDpr(row.lastWeek)}
          <br>

          <span class="${differenceClass}">
            ${differenceText}
          </span>
        </p>
      `;

      container.appendChild(card);
    });
  }


  function renderLastSeven(rows) {
    const spriteRow =
      document.getElementById(
        'bossSpriteRow'
      );

    const damageRow =
      document.getElementById(
        'bossDamageRow'
      );

    spriteRow.innerHTML = '';
    damageRow.innerHTML = '';

    rows.forEach(function(row) {
      const bossItem =
        document.createElement('div');

      bossItem.className =
        'boss-item';

      const visual =
        createBossVisual(
          row.code,
          row.boss
        );

      const rank =
        document.createElement('span');

      rank.className =
        'boss-rank ' +
        getRankClass(row.dprRank);

      rank.textContent =
        formatRank(row.dprRank);

      bossItem.appendChild(visual);
      bossItem.appendChild(rank);

      spriteRow.appendChild(bossItem);

      const metrics =
        document.createElement('div');

      metrics.className =
        'boss-history-metrics';

      const damage =
        document.createElement('span');

      damage.className =
        'boss-damage';

      damage.textContent =
        formatDamage(row.damage);

      metrics.appendChild(damage);
      damageRow.appendChild(metrics);
    });

    renderDprChart(rows);
  }


  function renderDprChart(rows) {
    renderSimpleChart({
      svgId: 'dprChart',
      values: rows.map(function(row) {
        return {
          label: '',
          value: parseNumeric(row.dpr)
        };
      }),
      comparisonValues:
        rows.map(function(row) {
          return {
            label: '',
            value: parseNumeric(
              row.pastFourAverageDpr
            )
          };
        }),
      comparisonLabel: 'Avg',
      colour: getCssVariable('--accent'),
      width: 700,
      height: 220,
      compact: true,
      formatter: formatDpr
    });
  }


  function renderStreaks(rows) {
    const container =
      document.getElementById(
        'streaksGrid'
      );

    container.innerHTML = '';

    rows.forEach(function(row) {
      const card =
        document.createElement('article');

      card.className = 'streak-card';

      const name =
        document.createElement('p');

      name.className = 'streak-name';
      name.textContent = row.metric;
      card.appendChild(name);

      const values =
        document.createElement('div');

      values.className = 'streak-values';

      values.appendChild(
        createStreakValueButton(
          row.current,
          'Current',
          row.metric,
          row.currentResults,
          'Current streak',
          'streak-current'
        )
      );

      values.appendChild(
        createStreakValueButton(
          row.best,
          'Best',
          row.metric,
          row.bestResults,
          'Best streak',
          'streak-best'
        )
      );

      card.appendChild(values);
      container.appendChild(card);
    });
  }


  function createStreakValueButton(
    value,
    label,
    metric,
    results,
    detailLabel,
    className
  ) {
    const button =
      document.createElement('button');

    button.type = 'button';
    button.className =
      className + ' streak-value-button';

    const numeric =
      Number(value) || 0;

    button.innerHTML =
      className === 'streak-current'
        ? (
            '<strong>' +
            escapeHtml(String(numeric)) +
            '</strong><span>' +
            escapeHtml(label) +
            '</span>'
          )
        : (
            '<span>' +
            escapeHtml(label) +
            '</span><strong>' +
            escapeHtml(String(numeric)) +
            '</strong>'
          );

    if (
      numeric > 0 &&
      Array.isArray(results) &&
      results.length
    ) {
      button.classList.add('is-selectable');
      button.addEventListener(
        'click',
        function() {
          openStreakModal(
            metric,
            detailLabel,
            results
          );
        }
      );
    } else {
      button.disabled = true;
    }

    return button;
  }



  function renderRecords(rows) {
    const container =
      document.getElementById(
        'recordsGrid'
      );

    container.innerHTML = '';

    rows.forEach(function(row) {
      const isDamage =
        row.metric
          .toLowerCase()
          .includes('damage');

      const card =
        document.createElement('article');

      card.className =
        'record-card';

      card.innerHTML = `
        <p class="record-label">
          ${escapeHtml(row.metric)}
        </p>

        <p class="record-value">
          ${
            isDamage
              ? formatDamage(row.value)
              : formatDpr(row.value)
          }
        </p>

        <p class="record-context">
          ${escapeHtml(row.boss)}
          ${
            row.date
              ? (
                  ' · ' +
                  escapeHtml(
                    compactDate(row.date)
                  )
                )
              : ''
          }
        </p>
      `;

      container.appendChild(card);
    });
  }


  /**
   * ==========================================================
   * BOSSES
   * ==========================================================
   */

  function loadBossPage(code) {
    const requestedCode =
      code || 'TK';

    currentBossCode =
      requestedCode;

    document
      .getElementById('bossSelect')
      .value = requestedCode;

    applyBossTheme(requestedCode);

    showBossTableMessage('Loading…');

    if (bossPageCache[requestedCode]) {
      renderBossPage(
        bossPageCache[requestedCode]
      );

      return;
    }

    requestApi(
      'boss',
      {
        boss: requestedCode
      },
      function(data) {
        bossPageCache[requestedCode] = data;

        if (
          currentView === 'bosses' &&
          currentBossCode === requestedCode
        ) {
          renderBossPage(data);
        }
      },
      function(error) {
        showBossTableMessage(
          error && error.message
            ? error.message
            : String(error)
        );
      }
    );
  }


  function renderBossPage(data) {
    const boss =
      data.boss ||
      BOSS_META[currentBossCode];

    currentBossCode =
      boss.code;

    applyBossTheme(boss.code);

    document
      .getElementById('bossSelect')
      .value = boss.code;

    const visualContainer =
      document.getElementById(
        'bossPageVisual'
      );

    visualContainer.innerHTML = '';

    visualContainer.appendChild(
      createBossVisual(
        boss.code,
        boss.name
      )
    );

    setText(
      'bossAttemptCount',
      String(data.attempts || 0)
    );

    setText(
      'bossBestDpr',
      formatDpr(data.personalBestDpr)
    );

    setText(
      'bossBestDamage',
      formatDamage(data.personalBestDamage)
    );

    setText(
      'bossAverageDprRank',
      formatAverageRank(data.averageDprRank)
    );

    setText(
      'bossLastFourDpr',
      formatDpr(data.lastFourAverageDpr)
    );

    setText(
      'bossLastFourDamage',
      formatDamage(
        data.lastFourAverageDamage
      )
    );

    renderBossResultsTable(
      data.results || [],
      data.isAllBosses === true
    );

    renderBossComparison(
      data.lastFourComparison || []
    );

    renderDprRankMatrix(
      data.dprRankMatrix || []
    );
  }


  function renderBossResultsTable(
    results,
    showBossColumn
  ) {
    const body =
      document.getElementById(
        'bossResultsBody'
      );

    const table =
      document.querySelector(
        '.boss-results-table'
      );

    if (table) {
      table.classList.toggle(
        'show-all-boss',
        showBossColumn === true
      );
    }

    body.innerHTML = '';

    if (!results.length) {
      showBossTableMessage(
        'No results recorded.'
      );

      return;
    }

    results.forEach(function(result) {
      const row =
        document.createElement('tr');

      if (result.isPersonalBest) {
        row.classList.add(
          'personal-best'
        );
      }

      const bossMeta =
        BOSS_META[result.bossCode] ||
        BOSS_META.ALL;

      row.innerHTML = `
        <td class="all-boss-only table-boss-code">
          <span
            style="color:${bossMeta.accent}"
          >
            ${escapeHtml(result.bossCode || '')}
          </span>
        </td>

        <td>
          ${escapeHtml(compactDate(result.date))}
        </td>

        <td>
          ${formatDamage(result.damage)}
        </td>

        <td class="table-rank">
          ${formatRankHtml(result.damageRank)}
        </td>

        <td>
          ${formatDpr(result.dpr)}
        </td>

        <td class="table-rank">
          ${formatRankHtml(result.dprRank)}
        </td>
      `;

      body.appendChild(row);
    });
  }



  function renderBossComparison(items) {
    const container =
      document.getElementById(
        'bossComparisonTable'
      );

    container.innerHTML = '';

    if (!items.length) {
      container.textContent =
        'No comparison data available.';

      return;
    }

    const headings =
      document.createElement('div');

    headings.className =
      'comparison-boss-headings';

    items.forEach(function(item) {
      const heading =
        document.createElement('div');

      heading.className =
        'comparison-boss-heading';

      const code =
        document.createElement('span');

      code.className =
        'comparison-boss-code';

      code.textContent = item.code;
      heading.appendChild(code);

      heading.appendChild(
        createBossVisual(
          item.code,
          item.name
        )
      );

      headings.appendChild(heading);
    });

    container.appendChild(headings);

    renderComparisonRow(
      container,
      'Avg Damage',
      items,
      'damage',
      false,
      formatDamage
    );

    renderComparisonRow(
      container,
      'Avg DPR',
      items,
      'dpr',
      false,
      formatDpr
    );

    renderComparisonRow(
      container,
      'Avg Guild Rank',
      items,
      'dprRank',
      true,
      formatAverageRank
    );
  }


  function renderComparisonRow(
    container,
    label,
    items,
    propertyName,
    lowerIsBetter,
    formatter
  ) {
    const wrapper =
      document.createElement('div');

    wrapper.className =
      'comparison-row';

    const rowLabel =
      document.createElement('p');

    rowLabel.className =
      'comparison-row-label';

    rowLabel.textContent = label;
    wrapper.appendChild(rowLabel);

    const valuesGrid =
      document.createElement('div');

    valuesGrid.className =
      'comparison-values';

    const positions =
      getComparisonPositions(
        items,
        propertyName,
        lowerIsBetter
      );

    items.forEach(function(item) {
      const cell =
        document.createElement('div');

      const position =
        positions[item.code] || 7;

      cell.className =
        'comparison-cell' +
        (position === 1 ? ' is-best' : '');

      cell.setAttribute(
        'style',
        getComparisonCellStyle(
          item.code,
          position
        )
      );

      cell.textContent =
        formatter(item[propertyName]);

      valuesGrid.appendChild(cell);
    });

    wrapper.appendChild(valuesGrid);
    container.appendChild(wrapper);
  }


  function getComparisonPositions(
    items,
    propertyName,
    lowerIsBetter
  ) {
    const sortable = items
      .map(function(item) {
        return {
          code: item.code,
          value: parseNumeric(
            item[propertyName]
          )
        };
      })
      .filter(function(item) {
        return Number.isFinite(item.value);
      })
      .sort(function(a, b) {
        return lowerIsBetter
          ? a.value - b.value
          : b.value - a.value;
      });

    const positions = {};

    sortable.forEach(function(item, index) {
      positions[item.code] = index + 1;
    });

    return positions;
  }


  function getComparisonCellStyle(
    code,
    position
  ) {
    const theme =
      BOSS_META[code] ||
      BOSS_META.SM;

    const alphaLevels = [
      0.44,
      0.30,
      0.20,
      0.13,
      0.08,
      0.045,
      0.022
    ];

    const alpha =
      alphaLevels[
        Math.max(
          0,
          Math.min(6, position - 1)
        )
      ];

    return (
      'background:' +
      hexToRgba(theme.accent, alpha) +
      ';border-color:' +
      hexToRgba(
        theme.accent,
        Math.min(alpha + 0.12, 0.42)
      ) +
      ';'
    );
  }


  function hexToRgba(hex, alpha) {
    const clean =
      String(hex || '')
        .replace('#', '');

    if (clean.length !== 6) {
      return 'rgba(255,255,255,' +
        alpha +
        ')';
    }

    const red =
      parseInt(clean.slice(0, 2), 16);

    const green =
      parseInt(clean.slice(2, 4), 16);

    const blue =
      parseInt(clean.slice(4, 6), 16);

    return (
      'rgba(' +
      red + ',' +
      green + ',' +
      blue + ',' +
      alpha +
      ')'
    );
  }


  function renderDprRankMatrix(items) {
    const container =
      document.getElementById(
        'dprRankMatrix'
      );

    container.innerHTML = '';

    if (!items.length) {
      container.textContent =
        'No rank data available.';

      return;
    }

    const grid =
      document.createElement('div');

    grid.className =
      'rank-matrix-grid';

    const corner =
      document.createElement('div');

    corner.className =
      'rank-matrix-corner';

    grid.appendChild(corner);

    items.forEach(function(item) {
      const heading =
        document.createElement('div');

      heading.className =
        'rank-matrix-heading';

      heading.appendChild(
        createBossVisual(
          item.code,
          item.name
        )
      );

      const code =
        document.createElement('span');

      code.className =
        'rank-matrix-heading-code';

      code.textContent =
        item.code;

      heading.appendChild(code);
      grid.appendChild(heading);
    });

    const columnMaximums = {};

    items.forEach(function(item) {
      columnMaximums[item.code] =
        Math.max.apply(
          null,
          (item.counts || []).concat([0])
        );
    });

    for (
      let rank = 1;
      rank <= 20;
      rank++
    ) {
      const rowLabel =
        document.createElement('div');

      rowLabel.className =
        'rank-matrix-position';

      rowLabel.textContent =
        '#' + rank;

      grid.appendChild(rowLabel);

      items.forEach(function(item) {
        const count =
          Number(
            (item.counts || [])[rank - 1]
          ) || 0;

        const maximum =
          columnMaximums[item.code] || 0;

        const cell =
          document.createElement('div');

        cell.className =
          'rank-matrix-cell' +
          (
            count === 0
              ? ' is-zero'
              : ''
          );

        cell.setAttribute(
          'style',
          getRankMatrixCellStyle(
            item.code,
            count,
            maximum
          )
        );

        cell.textContent =
          count > 0
            ? String(count)
            : '';

        cell.title =
          item.name +
          ' rank #' +
          rank +
          ': ' +
          count;

        grid.appendChild(cell);
      });
    }

    container.appendChild(grid);
  }


  function getRankMatrixCellStyle(
    code,
    count,
    maximum
  ) {
    const theme =
      BOSS_META[code] ||
      BOSS_META.SM;

    if (
      count <= 0 ||
      maximum <= 0
    ) {
      return (
        'background:' +
        hexToRgba(theme.accent, 0.018) +
        ';border-color:' +
        hexToRgba(theme.accent, 0.035) +
        ';'
      );
    }

    const ratio =
      count / maximum;

    const alpha =
      0.035 +
      Math.pow(ratio, 1.45) *
      0.48;

    const borderAlpha =
      Math.min(
        0.68,
        alpha + 0.10
      );

    return (
      'background:' +
      hexToRgba(theme.accent, alpha) +
      ';border-color:' +
      hexToRgba(
        theme.accent,
        borderAlpha
      ) +
      ';' +
      (
        ratio >= 0.999
          ? (
              'box-shadow:0 0 10px ' +
              hexToRgba(
                theme.accent,
                0.18
              ) +
              ';'
            )
          : ''
      )
    );
  }


  function showBossTableMessage(message) {
    const colspan =
      currentBossCode === 'ALL'
        ? 6
        : 5;

    document
      .getElementById('bossResultsBody')
      .innerHTML = `
        <tr>
          <td
            colspan="${colspan}"
            class="table-message"
          >
            ${escapeHtml(message)}
          </td>
        </tr>
      `;
  }



  /**
   * ==========================================================
   * PROGRESS
   * ==========================================================
   */

  function loadProgressPage(forceRefresh) {
    if (progressData && !forceRefresh) {
      renderProgressPage(progressData);
      return;
    }

    showLoading();

    requestApi(
      'progress',
      {},
      function(data) {
        progressData = data;

        renderProgressPage(data);
        hideLoading();
      },
      showError
    );
  }


  function renderProgressPage(data) {
    renderSimpleChart({
      svgId: 'powerProgressChart',
      values: data.power,
      colour: '#ffab45',
      width: 700,
      height: 260,
      formatter: formatPower
    });

    renderSimpleChart({
      svgId: 'dprProgressChart',
      values: data.dpr,
      colour: '#4da3ff',
      width: 700,
      height: 260,
      formatter: formatDpr
    });

    renderSimpleChart({
      svgId: 'damageProgressChart',
      values: data.damage,
      colour: '#ff5a66',
      width: 700,
      height: 260,
      formatter: formatDamage
    });

    renderSimpleChart({
      svgId: 'rankProgressChart',
      values: data.dprRank,
      colour: '#ff70d7',
      width: 700,
      height: 260,
      formatter: formatAverageRank,
      lowerIsBetter: true
    });

    renderMilestones(
      data.milestones || {}
    );

    renderClassDistribution(
      data.classDistribution || []
    );
  }


  function renderSimpleChart(options) {
    const svg =
      document.getElementById(
        options.svgId
      );

    svg.innerHTML = '';

    const compact =
      options.compact === true;

    if (compact) {
      const scale =
        document.getElementById(
          'chartScale'
        );

      if (scale) {
        scale.innerHTML = '';
      }
    }

    const points =
      (options.values || [])
        .filter(function(item) {
          return Number.isFinite(
            parseNumeric(item.value)
          );
        });

    if (!points.length) {
      svg.innerHTML = `
        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          class="progress-axis-label"
        >
          No data available
        </text>
      `;

      return;
    }

    const measuredWidth =
      compact
        ? svg.clientWidth
        : 0;

    const measuredHeight =
      compact
        ? svg.clientHeight
        : 0;

    const width =
      compact && measuredWidth > 0
        ? measuredWidth
        : (options.width || 700);

    const height =
      compact && measuredHeight > 0
        ? measuredHeight
        : (options.height || 260);

    if (compact) {
      svg.setAttribute(
        'viewBox',
        '0 0 ' + width + ' ' + height
      );
    }

    const lowerIsBetter =
      options.lowerIsBetter === true;

    const left =
      compact ? 0 : 70;

    const right =
      compact ? 0 : 22;

    const top =
      compact ? 34 : 34;

    const bottom =
      compact ? 22 : 52;

    const plotWidth =
      width - left - right;

    const plotHeight =
      height - top - bottom;

    const comparisonPoints =
      compact &&
      Array.isArray(
        options.comparisonValues
      )
        ? options.comparisonValues
            .map(function(item, index) {
              return {
                label: item.label || '',
                value:
                  parseNumeric(item.value),
                sourceIndex: index
              };
            })
            .filter(function(item) {
              return Number.isFinite(
                item.value
              );
            })
        : [];

    const numericValues =
      points
        .map(function(item) {
          return parseNumeric(item.value);
        })
        .concat(
          comparisonPoints.map(
            function(item) {
              return item.value;
            }
          )
        );

    const rawMin =
      Math.min.apply(null, numericValues);

    const rawMax =
      Math.max.apply(null, numericValues);

    const spread =
      Math.max(
        rawMax - rawMin,
        Math.abs(rawMax) * 0.1,
        1
      );

    const min =
      Math.max(
        0,
        rawMin - spread * 0.15
      );

    const max =
      rawMax + spread * 0.15;

    const xFor = function(index) {
      if (compact) {
        return (
          left +
          (
            (index + 0.5) /
            points.length
          ) *
          plotWidth
        );
      }

      if (points.length === 1) {
        return left + plotWidth / 2;
      }

      return (
        left +
        (
          index /
          (points.length - 1)
        ) *
        plotWidth
      );
    };

    const yFor = function(value) {
      const ratio =
        (value - min) /
        (max - min);

      return lowerIsBetter
        ? (
            top +
            ratio *
            plotHeight
          )
        : (
            top +
            (
              1 - ratio
            ) *
            plotHeight
          );
    };

    const gridValues =
      lowerIsBetter
        ? [
            min,
            min + (max - min) / 2,
            max
          ]
        : [
            max,
            min + (max - min) / 2,
            min
          ];

    gridValues.forEach(
      function(value, index) {
        const y =
          top +
          index *
          (plotHeight / 2);

        svg.appendChild(
          createSvgElement(
            'line',
            {
              x1: left,
              x2: width - right,
              y1: y,
              y2: y,
              class:
                compact
                  ? 'chart-grid-line'
                  : 'progress-grid-line'
            }
          )
        );

        if (!compact) {
          const label =
            createSvgElement(
              'text',
              {
                x: left - 10,
                y: y + 4,
                'text-anchor': 'end',
                class:
                  'progress-axis-label'
              }
            );

          label.textContent =
            options.formatter(value);

          svg.appendChild(label);
        }
      }
    );

    if (compact) {
      const scale =
        document.getElementById(
          'chartScale'
        );

      if (scale) {
        gridValues.forEach(
          function(value, index) {
            const label =
              document.createElement('span');

            label.className =
              'scale-label';

            label.style.top =
              (
                (
                  top +
                  index *
                  (plotHeight / 2)
                ) /
                height *
                100
              ) +
              '%';

            label.textContent =
              options.formatter(value);

            scale.appendChild(label);
          }
        );
      }
    }

    const chartPoints =
      points.map(function(item, index) {
        return {
          x: xFor(index),
          y: yFor(
            parseNumeric(item.value)
          ),
          label: item.label,
          value: item.value
        };
      });

    if (
      compact &&
      comparisonPoints.length
    ) {
      const averageChartPoints =
        comparisonPoints.map(
          function(item) {
            return {
              x:
                xFor(item.sourceIndex),
              y:
                yFor(item.value),
              value: item.value
            };
          }
        );

      if (averageChartPoints.length > 1) {
        const averageLine =
          createSvgElement(
            'polyline',
            {
              points:
                averageChartPoints
                  .map(function(point) {
                    return (
                      point.x +
                      ',' +
                      point.y
                    );
                  })
                  .join(' '),
              class: 'chart-average-line'
            }
          );

        svg.appendChild(averageLine);
      }

      const firstAveragePoint =
        averageChartPoints[0];

      if (firstAveragePoint) {
        const averageLabel =
          createSvgElement(
            'text',
            {
              x:
                Math.max(
                  left + 3,
                  firstAveragePoint.x + 3
                ),
              y:
                Math.max(
                  top + 12,
                  firstAveragePoint.y - 9
                ),
              'text-anchor': 'start',
              class: 'chart-average-label'
            }
          );

        averageLabel.textContent =
          options.comparisonLabel ||
          'Avg';

        svg.appendChild(averageLabel);
      }
    }

    const line =
      createSvgElement(
        'polyline',
        {
          points:
            chartPoints
              .map(function(point) {
                return (
                  point.x +
                  ',' +
                  point.y
                );
              })
              .join(' '),

          class:
            compact
              ? 'chart-line'
              : 'progress-line',

          stroke: options.colour
        }
      );

    svg.appendChild(line);

    const highlightValue =
      lowerIsBetter
        ? Math.min.apply(
            null,
            chartPoints.map(function(point) {
              return parseNumeric(point.value);
            })
          )
        : Math.max.apply(
            null,
            chartPoints.map(function(point) {
              return parseNumeric(point.value);
            })
          );

    const peakIndex =
      chartPoints.findIndex(function(point) {
        return (
          parseNumeric(point.value) ===
          highlightValue
        );
      });

    const currentIndex =
      chartPoints.length - 1;

    chartPoints.forEach(
      function(point, index) {
        const isHighlighted =
          !compact &&
          (
            index === peakIndex ||
            index === currentIndex
          );

        const circle =
          createSvgElement(
            'circle',
            {
              cx: point.x,
              cy: point.y,
              r:
                compact
                  ? 7
                  : isHighlighted
                    ? 7
                    : 4.5,
              fill: options.colour,
              class:
                compact
                  ? 'chart-point'
                  : 'progress-point'
            }
          );

        const title =
          createSvgElement(
            'title',
            {}
          );

        title.textContent =
          (
            point.label
              ? point.label + ': '
              : ''
          ) +
          options.formatter(point.value);

        circle.appendChild(title);
        svg.appendChild(circle);

        if (compact) {
          const valueLabel =
            createSvgElement(
              'text',
              {
                x: point.x,
                y:
                  point.y < 52
                    ? point.y + 25
                    : point.y - 15,
                'text-anchor':
                  index === 0
                    ? 'start'
                    : index ===
                      chartPoints.length - 1
                      ? 'end'
                      : 'middle',
                class:
                  'chart-value-label'
              }
            );

          valueLabel.textContent =
            options.formatter(
              point.value
            );

          svg.appendChild(valueLabel);
        }

        if (
          !compact &&
          shouldShowDateLabel(
            index,
            chartPoints.length
          )
        ) {
          const guide =
            createSvgElement(
              'line',
              {
                x1: point.x,
                x2: point.x,
                y1: height - 39,
                y2:
                  Math.min(
                    height - 43,
                    point.y + 9
                  ),
                class:
                  'progress-date-guide'
              }
            );

          svg.appendChild(guide);

          const dateLabel =
            createSvgElement(
              'text',
              {
                x: point.x,
                y: height - 14,
                'text-anchor':
                  index === 0
                    ? 'start'
                    : index ===
                      chartPoints.length - 1
                      ? 'end'
                      : 'middle',

                class:
                  'progress-date-label'
              }
            );

          dateLabel.textContent =
            compactDayMonth(
              point.label
            );

          svg.appendChild(dateLabel);
        }
      }
    );

    if (!compact) {
      addProgressValueLabel(
        svg,
        chartPoints[peakIndex],
        options.colour,
        options.formatter,
        width,
        height
      );

      if (currentIndex !== peakIndex) {
        addProgressValueLabel(
          svg,
          chartPoints[currentIndex],
          options.colour,
          options.formatter,
          width,
          height
        );
      }
    }
  }


  function addProgressValueLabel(
    svg,
    point,
    colour,
    formatter,
    width,
    height
  ) {
    if (!point) {
      return;
    }

    const label =
      createSvgElement(
        'text',
        {
          x: point.x,
          y:
            point.y < 48
              ? point.y + 22
              : point.y - 13,
          'text-anchor':
            point.x > width - 90
              ? 'end'
              : point.x < 90
                ? 'start'
                : 'middle',
          class:
            'progress-value-label',
          fill: colour
        }
      );

    label.textContent =
      formatter(point.value);

    svg.appendChild(label);
  }


  function shouldShowDateLabel(
    index,
    total
  ) {
    if (total <= 6) {
      return true;
    }

    const interval =
      Math.ceil(total / 5);

    return (
      index === 0 ||
      index === total - 1 ||
      index % interval === 0
    );
  }


  function renderMilestones(data) {
    const container =
      document.getElementById(
        'milestonesContainer'
      );

    container.innerHTML = '';

    container.appendChild(
      createMilestoneTrack(
        'DPR milestones',
        data.dpr || [],
        '#4da3ff'
      )
    );

    container.appendChild(
      createMilestoneTrack(
        'Damage milestones',
        data.damage || [],
        '#ff5a66'
      )
    );

    container.appendChild(
      createMilestoneTrack(
        'Weekly average DPR',
        data.weekly || [],
        '#4cff8b'
      )
    );

    const rankGrid =
      document.createElement('div');

    rankGrid.className =
      'milestone-rank-grid';

    (data.firstRanks || [])
      .forEach(function(item) {
        rankGrid.appendChild(
          createMilestoneRankCard(item)
        );
      });

    container.appendChild(rankGrid);

    const checklist =
      document.createElement('article');

    checklist.className =
      'milestone-checklist-card';

    const heading =
      document.createElement('div');

    heading.className =
      'milestone-subheading';

    heading.innerHTML = `
      <p class="eyebrow">Completion challenges</p>
      <h3>Checklists</h3>
    `;

    checklist.appendChild(heading);

    const list =
      document.createElement('div');

    list.className =
      'milestone-checklist-list';

    if (
      data.checklists &&
      data.checklists.pbCycle
    ) {
      list.appendChild(
        createChecklistRow(
          data.checklists.pbCycle
        )
      );
    }

    (
      data.checklists &&
      data.checklists.classes
        ? data.checklists.classes
        : []
    ).forEach(function(item) {
      list.appendChild(
        createChecklistRow(item)
      );
    });

    checklist.appendChild(list);
    container.appendChild(checklist);
  }


  function createMilestoneTrack(
    title,
    items,
    colour
  ) {
    const card =
      document.createElement('article');

    card.className = 'milestone-track-card';

    const titleElement =
      document.createElement('h3');

    titleElement.textContent = title;
    card.appendChild(titleElement);

    const track =
      document.createElement('div');

    track.className = 'milestone-track';

    items.forEach(function(item) {
      const node =
        document.createElement('div');

      node.className =
        'milestone-node ' +
        (
          item.achieved
            ? 'achieved'
            : 'pending'
        );

      node.style.setProperty(
        '--milestone-colour',
        colour
      );

      const marker =
        document.createElement('span');

      marker.className =
        'milestone-marker';

      node.appendChild(marker);

      const content =
        document.createElement('div');

      content.className =
        'milestone-node-content';

      const valueText =
        formatMilestoneValue(item);

      content.innerHTML = `
        <strong>${escapeHtml(item.label || '')}</strong>
        <span class="milestone-status">
          ${
            item.achieved
              ? 'Achieved'
              : 'Closest'
          }
        </span>
        <span class="milestone-result">
          ${escapeHtml(valueText)}
        </span>
        <span class="milestone-context">
          ${escapeHtml(
            buildMilestoneContext(item)
          )}
        </span>
      `;

      node.appendChild(content);
      track.appendChild(node);
    });

    card.appendChild(track);
    return card;
  }


  function formatMilestoneValue(item) {
    if (
      item.value === '' ||
      item.value === null ||
      item.value === undefined
    ) {
      return 'No result yet';
    }

    return item.type === 'damage'
      ? formatDamage(item.value)
      : formatDpr(item.value);
  }


  function buildMilestoneContext(item) {
    const parts = [];

    if (item.boss) {
      parts.push(item.boss);
    }

    if (item.date) {
      parts.push(item.date);
    }

    return parts.join(' · ');
  }


  function createMilestoneRankCard(item) {
    const card =
      document.createElement('article');

    card.className =
      'milestone-rank-card ' +
      (
        item.achieved
          ? 'achieved'
          : 'pending'
      );

    card.innerHTML = `
      <p class="record-label">
        ${escapeHtml(item.label || '')}
      </p>
      <p class="milestone-rank-value">
        ${
          item.achieved
            ? '#1'
            : '—'
        }
      </p>
      <p class="full-record-context">
        ${escapeHtml(buildMilestoneContext(item))}
      </p>
      <p class="milestone-small-result">
        ${escapeHtml(formatMilestoneValue(item))}
      </p>
    `;

    return card;
  }


  function createChecklistRow(item) {
    const row =
      document.createElement('div');

    row.className =
      'milestone-checklist-row ' +
      (
        item.achieved
          ? 'achieved'
          : 'pending'
      );

    const missing =
      Array.isArray(item.missing) &&
      item.missing.length
        ? 'Missing ' + item.missing.join(', ')
        : '';

    row.innerHTML = `
      <span class="checklist-icon">
        ${item.achieved ? '✓' : '○'}
      </span>
      <div>
        <strong>${escapeHtml(item.label || '')}</strong>
        <span>
          ${escapeHtml(
            String(item.value || 0) +
            '/' +
            String(item.total || 0)
          )}
          ${
            item.date
              ? ' · ' + escapeHtml(item.date)
              : ''
          }
        </span>
        <small>
          ${escapeHtml(missing || item.context || '')}
        </small>
      </div>
    `;

    return row;
  }


  function renderClassDistribution(items) {
    const container =
      document.getElementById(
        'classDistribution'
      );

    container.innerHTML = '';

    if (!items.length) {
      container.textContent =
        'No class data available.';
      return;
    }

    const bar =
      document.createElement('div');

    bar.className =
      'class-distribution-bar';

    items.forEach(function(item) {
      if (item.percentage <= 0) {
        return;
      }

      const segment =
        document.createElement('span');

      segment.className =
        'class-distribution-segment';

      segment.style.width =
        item.percentage + '%';

      segment.style.background =
        item.colour;

      segment.title =
        item.name +
        ': ' +
        item.percentage.toFixed(1) +
        '%';

      bar.appendChild(segment);
    });

    container.appendChild(bar);

    const legend =
      document.createElement('div');

    legend.className =
      'class-distribution-legend';

    items.forEach(function(item) {
      const row =
        document.createElement('div');

      row.className =
        'class-distribution-item';

      row.innerHTML = `
        <span
          class="class-distribution-swatch"
          style="background:${item.colour}"
        ></span>
        <span class="class-distribution-name">
          ${escapeHtml(item.name)}
        </span>
        <strong>
          ${item.percentage.toFixed(1)}%
        </strong>
        <small>${item.count}</small>
      `;

      legend.appendChild(row);
    });

    container.appendChild(legend);
  }


  /**
   * ==========================================================
   * FULL RECORDS PAGE
   * ==========================================================
   */

  function loadRecordsPage(forceRefresh) {
    if (recordsData && !forceRefresh) {
      renderFullRecordsPage(recordsData);
      return;
    }

    showLoading();

    requestApi(
      'records',
      {},
      function(data) {
        recordsData = data;

        renderFullRecordsPage(data);
        hideLoading();
      },
      showError
    );
  }


  function renderFullRecordsPage(data) {
    renderRecordLeaderboards(
      data.topDpr || [],
      data.topDamage || []
    );

    renderSimpleRecordTiles(
      'recordFinishGrid',
      data.finishCounts || []
    );

    renderSimpleRecordTiles(
      'recordThresholdGrid',
      data.thresholdCounts || []
    );

    renderRelativeRecordTiles(
      data.relativeRecords || []
    );

    renderPbGapTiles(
      data.pbGapRecords || []
    );

    renderRecordStreaks(
      data.streaks || []
    );

    renderWeirdRecordTiles(
      data.weirdStats || []
    );
  }


  function renderRecordLeaderboards(
    dprRows,
    damageRows
  ) {
    const container =
      document.getElementById(
        'recordLeaderboards'
      );

    container.innerHTML = '';

    container.appendChild(
      createRecordLeaderboard(
        'Top 10 DPR results',
        dprRows,
        'dpr'
      )
    );

    container.appendChild(
      createRecordLeaderboard(
        'Top 10 Damage results',
        damageRows,
        'damage'
      )
    );
  }


  function createRecordLeaderboard(
    title,
    rows,
    type
  ) {
    const card =
      document.createElement('article');

    card.className =
      'record-leaderboard-card';

    const heading =
      document.createElement('div');

    heading.className =
      'record-leaderboard-heading';

    heading.innerHTML = `
      <p class="eyebrow">Personal leaderboard</p>
      <h2>${escapeHtml(title)}</h2>
    `;

    card.appendChild(heading);

    const list =
      document.createElement('div');

    list.className =
      'record-leaderboard-list';

    rows.forEach(function(result, index) {
      const row =
        document.createElement('div');

      const position = index + 1;

      row.className =
        'record-leaderboard-row ' +
        (
          position <= 3
            ? 'podium-' + position
            : ''
        );

      const value =
        type === 'damage'
          ? formatDamage(result.damage)
          : formatDpr(result.dpr);

      const guildRank =
        type === 'damage'
          ? result.damageRank
          : result.dprRank;

      row.innerHTML = `
        <span class="record-leaderboard-position">
          ${position}
        </span>
        <div class="record-leaderboard-result">
          <strong>${escapeHtml(value)}</strong>
          <span>
            ${escapeHtml(result.boss || '')}
            ·
            ${escapeHtml(compactDate(result.date))}
          </span>
        </div>
        <span class="record-leaderboard-guild-rank">
          ${formatRankHtml(guildRank)}
        </span>
      `;

      list.appendChild(row);
    });

    card.appendChild(list);
    return card;
  }


  function renderSimpleRecordTiles(
    containerId,
    items
  ) {
    const container =
      document.getElementById(
        containerId
      );

    container.innerHTML = '';

    items.forEach(function(item) {
      const tile =
        document.createElement('article');

      tile.className =
        'record-stat-tile';

      tile.innerHTML = `
        <p class="record-label">
          ${escapeHtml(item.label || '')}
        </p>
        <p class="record-stat-value">
          ${escapeHtml(String(item.value || 0))}
        </p>
      `;

      container.appendChild(tile);
    });
  }


  function renderRelativeRecordTiles(items) {
    const container =
      document.getElementById(
        'recordRelativeGrid'
      );

    container.innerHTML = '';

    items.forEach(function(record) {
      const tile =
        document.createElement('article');

      tile.className =
        'record-wide-tile';

      tile.innerHTML = `
        <p class="record-label">
          ${escapeHtml(record.label)}
        </p>
        <p class="record-wide-value">
          ${formatRecordValue(record)}
        </p>
        <p class="full-record-context">
          ${escapeHtml(record.context || '')}
        </p>
      `;

      container.appendChild(tile);
    });
  }


  function renderPbGapTiles(items) {
    const container =
      document.getElementById(
        'recordPbGrid'
      );

    container.innerHTML = '';

    items.forEach(function(item) {
      const tile =
        document.createElement('article');

      tile.className =
        'record-stat-tile pb-gap-tile';

      let context =
        item.boss && item.metric
          ? item.boss + ' · ' + item.metric
          : '';

      if (item.fromDate && item.toDate) {
        context +=
          ' · ' +
          item.fromDate +
          ' → ' +
          item.toDate;
      } else if (item.sinceDate) {
        context +=
          ' · since ' +
          item.sinceDate;
      }

      tile.innerHTML = `
        <p class="record-label">
          ${escapeHtml(item.label || '')}
        </p>
        <p class="record-stat-value">
          ${escapeHtml(String(item.days || 0))}
          <span>days</span>
        </p>
        <p class="full-record-context">
          ${escapeHtml(context)}
        </p>
      `;

      container.appendChild(tile);
    });
  }


  function renderRecordStreaks(items) {
    const container =
      document.getElementById(
        'recordStreaksGrid'
      );

    container.innerHTML = '';

    items.forEach(function(item) {
      const tile =
        document.createElement('article');

      tile.className =
        'record-streak-tile';

      const title =
        document.createElement('p');

      title.className =
        'record-label';

      title.textContent = item.metric;
      tile.appendChild(title);

      const best =
        createRecordStreakButton(
          item.best,
          'Best',
          item.metric,
          item.bestResults,
          'Best streak',
          true
        );

      const current =
        createRecordStreakButton(
          item.current,
          'Current',
          item.metric,
          item.currentResults,
          'Current streak',
          false
        );

      tile.appendChild(best);
      tile.appendChild(current);
      container.appendChild(tile);
    });
  }


  function createRecordStreakButton(
    value,
    label,
    metric,
    results,
    detailLabel,
    primary
  ) {
    const button =
      document.createElement('button');

    button.type = 'button';
    button.className =
      primary
        ? 'record-streak-best'
        : 'record-streak-current';

    const numeric = Number(value) || 0;

    button.innerHTML = `
      <strong>${numeric}</strong>
      <span>${escapeHtml(label)}</span>
    `;

    if (
      numeric > 0 &&
      Array.isArray(results) &&
      results.length
    ) {
      button.classList.add('is-selectable');
      button.addEventListener(
        'click',
        function() {
          openStreakModal(
            metric,
            detailLabel,
            results
          );
        }
      );
    } else {
      button.disabled = true;
    }

    return button;
  }


  function renderWeirdRecordTiles(items) {
    const container =
      document.getElementById(
        'recordWeirdGrid'
      );

    container.innerHTML = '';

    items.forEach(function(item) {
      const tile =
        document.createElement('article');

      tile.className =
        'record-stat-tile weird-record-tile';

      tile.innerHTML = `
        <p class="record-label">
          ${escapeHtml(item.label || '')}
        </p>
        <p class="record-stat-value">
          ${escapeHtml(String(item.value || 0))}
        </p>
        <p class="full-record-context">
          ${escapeHtml(item.context || '')}
        </p>
      `;

      container.appendChild(tile);
    });
  }


  function formatRecordValue(record) {
    switch (record.type) {
      case 'dpr':
        return formatDpr(record.value);

      case 'damage':
        return formatDamage(record.value);

      case 'rank':
        return formatRank(record.value);

      case 'power':
        return formatPower(record.value);

      case 'signedDpr':
        return formatSignedDpr(record.value);

      case 'number':
        return formatPlainNumber(record.value);

      case 'text':
        return escapeHtml(record.value);

      default:
        return escapeHtml(record.value);
    }
  }


  function openStreakModal(
    metric,
    detailLabel,
    results
  ) {
    const modal =
      document.getElementById(
        'streakModal'
      );

    const title =
      document.getElementById(
        'streakModalTitle'
      );

    const eyebrow =
      document.getElementById(
        'streakModalEyebrow'
      );

    const container =
      document.getElementById(
        'streakModalResults'
      );

    title.textContent = metric;
    eyebrow.textContent = detailLabel;
    container.innerHTML = '';

    results.forEach(function(result) {
      const row =
        document.createElement('div');

      row.className =
        'streak-modal-result';

      const theme =
        BOSS_META[result.code] ||
        BOSS_META.ALL;

      row.innerHTML = `
        <span class="streak-result-date">
          ${escapeHtml(compactDate(result.date))}
        </span>
        <span
          class="streak-result-boss"
          style="color:${theme.accent}"
        >
          ${escapeHtml(result.boss || result.code || '')}
        </span>
        <strong class="streak-result-dpr">
          ${formatDpr(result.dpr)}
        </strong>
        <span class="streak-result-rank">
          ${formatRankHtml(result.dprRank)}
        </span>
      `;

      container.appendChild(row);
    });

    modal.classList.remove('hidden');
    document.body.classList.add(
      'modal-open'
    );
  }


  function closeStreakModal() {
    const modal =
      document.getElementById(
        'streakModal'
      );

    if (!modal) {
      return;
    }

    modal.classList.add('hidden');
    document.body.classList.remove(
      'modal-open'
    );
  }


  function handleStreakModalBackdrop(event) {
    if (
      event.target &&
      event.target.id === 'streakModal'
    ) {
      closeStreakModal();
    }
  }


  /**
   * ==========================================================
   * NAVIGATION
   * ==========================================================
   */

  function showHomeView(scrollToTop) {
    currentView = 'home';

    document.body.classList.add(
      'home-view-active'
    );

    document.body.classList.remove(
      'boss-view-active'
    );

    showOnlyView('homeView');
    setActiveNavigation('home');

    if (homepageData) {
      activeHomeBossCode =
        homepageData
          .identity
          .todaysBossCode ||
        'TK';

      resetHomeBossCarousel();
      applyBossTheme(
        activeHomeBossCode
      );
    }

    if (scrollToTop !== false) {
      scrollPageToTop();
    }
  }


  function showBossesView() {
    currentView = 'bosses';

    document.body.classList.remove(
      'home-view-active'
    );

    document.body.classList.add(
      'boss-view-active'
    );

    showOnlyView('bossesView');
    setActiveNavigation('bosses');

    const requestedCode =
      currentBossCode ||
      (
        homepageData
          ? homepageData
              .identity
              .todaysBossCode
          : 'TK'
      );

    loadBossPage(requestedCode);
    scrollPageToTop();
  }


  function showProgressView() {
    currentView = 'progress';

    document.body.classList.remove(
      'home-view-active'
    );

    document.body.classList.remove(
      'boss-view-active'
    );

    showOnlyView('progressView');
    setActiveNavigation('progress');

    applyNeutralTheme();
    loadProgressPage(false);
    scrollPageToTop();
  }


  function showRecordsView() {
    currentView = 'records';

    document.body.classList.remove(
      'home-view-active'
    );

    document.body.classList.remove(
      'boss-view-active'
    );

    showOnlyView('recordsView');
    setActiveNavigation('records');

    applyNeutralTheme();
    loadRecordsPage(false);
    scrollPageToTop();
  }


  function showOnlyView(viewId) {
    [
      'homeView',
      'bossesView',
      'progressView',
      'recordsView'
    ].forEach(function(id) {
      document
        .getElementById(id)
        .classList.toggle(
          'hidden',
          id !== viewId
        );
    });
  }


  function setActiveNavigation(view) {
    const buttons = {
      home: 'homeNavButton',
      bosses: 'bossesNavButton',
      progress: 'progressNavButton',
      records: 'recordsNavButton'
    };

    Object.keys(buttons)
      .forEach(function(key) {
        document
          .getElementById(buttons[key])
          .classList.toggle(
            'active',
            key === view
          );
      });
  }


  function refreshCurrentView() {
    if (currentView === 'bosses') {
      delete bossPageCache[
        currentBossCode
      ];

      loadBossPage(
        currentBossCode
      );

      return;
    }

    if (currentView === 'progress') {
      progressData = null;
      loadProgressPage(true);
      return;
    }

    if (currentView === 'records') {
      recordsData = null;
      loadRecordsPage(true);
      return;
    }

    loadHomePage();
  }


  function scrollPageToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  /**
   * ==========================================================
   * BOSS VISUALS AND THEMES
   * ==========================================================
   */

  function createBossVisual(
    code,
    bossName
  ) {
    const wrapper =
      document.createElement('div');

    wrapper.className =
      'boss-visual';

    wrapper.title =
      bossName || code || '';

    const image =
      document.createElement('img');

    image.className =
      'boss-sprite hidden';

    image.alt =
      bossName || code || '';

    const fallback =
      document.createElement('div');

    fallback.className =
      'boss-code';

    fallback.textContent =
      code || '?';

    wrapper.appendChild(image);
    wrapper.appendChild(fallback);

    const imageUrl =
      getBossImage(code);

    if (!imageUrl) {
      return wrapper;
    }

    image.onload = function() {
      image.classList.remove('hidden');
      fallback.classList.add('hidden');
    };

    image.onerror = function() {
      image.classList.add('hidden');
      fallback.classList.remove('hidden');
    };

    image.src = imageUrl;

    return wrapper;
  }


  function applyBossTheme(code) {
    const theme =
      BOSS_META[code] ||
      BOSS_META.SM;

    const root =
      document.documentElement;

    root.style.setProperty(
      '--accent',
      theme.accent
    );

    root.style.setProperty(
      '--accent-soft',
      theme.soft
    );

    root.style.setProperty(
      '--boss-glow',
      theme.glow
    );

    root.style.setProperty(
      '--boss-surface',
      theme.surface
    );
  }


  function applyNeutralTheme() {
    const root =
      document.documentElement;

    root.style.setProperty(
      '--accent',
      '#8d63ff'
    );

    root.style.setProperty(
      '--accent-soft',
      'rgba(141, 99, 255, 0.16)'
    );

    root.style.setProperty(
      '--boss-glow',
      'rgba(141, 99, 255, 0.17)'
    );

    root.style.setProperty(
      '--boss-surface',
      'rgba(141, 99, 255, 0.055)'
    );
  }


  /**
   * ==========================================================
   * FORMATTING
   * ==========================================================
   */

  function getBossImage(code) {
    const imageUrl =
      BOSS_IMAGES[code];

    return (
      typeof imageUrl === 'string'
        ? imageUrl.trim()
        : ''
    );
  }


  function formatRankHtml(value) {
    const number =
      parseNumeric(value);

    if (!Number.isFinite(number)) {
      return '';
    }

    const rank =
      Math.round(number);

    return (
      '<span class="rank ' +
      getRankClass(rank) +
      '">#' +
      rank +
      '</span>'
    );
  }


  function getRankClass(value) {
    const number =
      parseNumeric(value);

    if (!Number.isFinite(number)) {
      return '';
    }

    const rank =
      Math.round(number);

    if (rank === 1) {
      return 'rank-medal rank-1';
    }

    if (rank === 2) {
      return 'rank-medal rank-2';
    }

    if (rank === 3) {
      return 'rank-medal rank-3';
    }

    return '';
  }


  function formatRank(value) {
    const number =
      parseNumeric(value);

    return Number.isFinite(number)
      ? '#' + Math.round(number)
      : '—';
  }


  function formatAverageRank(value) {
    const number =
      parseNumeric(value);

    return Number.isFinite(number)
      ? '#' + number.toFixed(1)
      : '—';
  }


  function formatDpr(value) {
    const number =
      parseNumeric(value);

    return Number.isFinite(number)
      ? number.toFixed(2)
      : '—';
  }


  function formatSignedDpr(value) {
    const number =
      parseNumeric(value);

    if (!Number.isFinite(number)) {
      return '—';
    }

    return (
      number > 0
        ? '+'
        : ''
    ) + number.toFixed(2);
  }


  function formatDamage(value) {
    const number =
      parseNumeric(value);

    if (!Number.isFinite(number)) {
      return '—';
    }

    const absolute =
      Math.abs(number);

    if (absolute >= 1e9) {
      return (
        formatDamageDecimal(
          number / 1e9
        ) +
        'Q'
      );
    }

    if (absolute >= 1e6) {
      return (
        formatDamageDecimal(
          number / 1e6
        ) +
        'T'
      );
    }

    return (
      formatDamageDecimal(
        number / 1e3
      ) +
      'B'
    );
  }


  function formatDamageDecimal(number) {
    return new Intl.NumberFormat(
      'en-GB',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(number);
  }


  function formatSignedDamage(value) {
    const number = parseNumeric(value);

    if (!Number.isFinite(number)) {
      return '—';
    }

    if (number > 0) {
      return '+' + formatDamage(number);
    }

    if (number < 0) {
      return '-' + formatDamage(Math.abs(number));
    }

    return formatDamage(0);
  }


  function formatPower(value) {
    const number =
      parseNumeric(value);

    if (!Number.isFinite(number)) {
      return '—';
    }

    const absolute =
      Math.abs(number);

    if (absolute >= 1e6) {
      return (
        formatPowerDecimal(
          number / 1e6
        ) +
        'G'
      );
    }

    if (absolute >= 1e3) {
      return (
        formatPowerDecimal(
          number / 1e3
        ) +
        'M'
      );
    }

    return (
      formatPowerDecimal(number) +
      'K'
    );
  }


  function formatPowerDecimal(number) {
    return new Intl.NumberFormat(
      'en-GB',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(number);
  }


  function formatPlainNumber(value) {
    const number =
      parseNumeric(value);

    if (!Number.isFinite(number)) {
      return '—';
    }

    return new Intl.NumberFormat(
      'en-GB',
      {
        maximumFractionDigits: 2
      }
    ).format(number);
  }


  function parseNumeric(value) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return NaN;
    }

    const cleaned =
      String(value)
        .replace(/,/g, '')
        .replace(
          /[^\d.+-]/g,
          ''
        );

    const number =
      Number(cleaned);

    return Number.isFinite(number)
      ? number
      : NaN;
  }


  function compactDate(value) {
    const text =
      String(value || '').trim();

    const match =
      text.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})/
      );

    if (!match) {
      return text;
    }

    const day =
      match[1].padStart(2, '0');

    const month =
      match[2].padStart(2, '0');

    const year =
      match[3].slice(-2);

    return (
      day +
      '/' +
      month +
      '/' +
      year
    );
  }


  function compactDayMonth(value) {
    const text =
      String(value || '').trim();

    const match =
      text.match(
        /^(\d{1,2})\/(\d{1,2})/
      );

    if (!match) {
      return text;
    }

    return (
      match[1].padStart(2, '0') +
      '/' +
      match[2].padStart(2, '0')
    );
  }


  function capitalize(value) {
    const text =
      String(value || '');

    return text
      ? (
          text
            .charAt(0)
            .toUpperCase() +
          text.slice(1)
        )
      : '';
  }


  function setText(id, text) {
    document
      .getElementById(id)
      .textContent =
        (
          text === null ||
          text === undefined ||
          text === ''
        )
          ? '—'
          : text;
  }


  function getCssVariable(name) {
    return getComputedStyle(
      document.documentElement
    )
      .getPropertyValue(name)
      .trim();
  }


  function createSvgElement(
    name,
    attributes
  ) {
    const element =
      document.createElementNS(
        'http:' +
        '/' +
        '/' +
        'www.w3.org/2000/svg',
        name
      );

    Object
      .entries(attributes)
      .forEach(function(entry) {
        element.setAttribute(
          entry[0],
          entry[1]
        );
      });

    return element;
  }


  function escapeHtml(value) {
  const safeValue =
    value === null ||
    value === undefined
      ? ''
      : value;

    return String(safeValue)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


  /**
   * ==========================================================
   * LOADING AND ERRORS
   * ==========================================================
   */

  function showLoading() {
    document
      .getElementById('app')
      .classList.add('hidden');

    document
      .getElementById('errorScreen')
      .classList.add('hidden');

    document
      .getElementById('loadingScreen')
      .classList.remove('hidden');
  }


  function hideLoading() {
    document
      .getElementById('loadingScreen')
      .classList.add('hidden');

    document
      .getElementById('errorScreen')
      .classList.add('hidden');

    document
      .getElementById('app')
      .classList.remove('hidden');
  }


  function showError(error) {
    document
      .getElementById('loadingScreen')
      .classList.add('hidden');

    document
      .getElementById('app')
      .classList.add('hidden');

    document
      .getElementById('errorScreen')
      .classList.remove('hidden');

    document
      .getElementById('errorMessage')
      .textContent =
        error && error.message
          ? error.message
          : String(error);
  }
