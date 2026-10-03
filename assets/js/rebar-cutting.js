/* Rebar cutting optimiser: page logic. The maths lives in cutting-engine.js. */
(function () {
  'use strict';
  var C = window.KCECut;
  var DIAS = [6, 8, 10, 12, 16, 20, 25, 32];
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var form = $('#rc-form');
  if (!form || !C) return;

  var piecesBody = $('#rc-pieces tbody');
  var runsBody = $('#rc-runs tbody');
  var statusEl = $('#rc-status');
  var resultsEl = $('#rc-results');
  var lastResult = null;

  // Bar weight in kg per metre: the standard d^2/162 rule (d in mm).
  function kgPerM(d) { return d * d / 162; }
  function fmt(n, dp) { return Number(n).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
  function m(x) { return fmt(x / 1000, (x % 1000 === 0) ? 0 : (x % 100 === 0 ? 1 : 2)); }

  // "12 × 0.7 + 2 × 0.6" instead of twelve repeats: what a bar bender reads.
  function groupCuts(cuts) {
    var out = [], i = 0;
    while (i < cuts.length) {
      var j = i;
      while (j < cuts.length && cuts[j] === cuts[i]) j++;
      out.push((j - i > 1 ? (j - i) + ' &times; ' : '') + m(cuts[i]));
      i = j;
    }
    return out.join(' + ');
  }

  function diaSelect(value) {
    return '<select name="dia" aria-label="Bar diameter">' + DIAS.map(function (d) {
      return '<option value="' + d + '"' + (d === value ? ' selected' : '') + '>Y' + d + '</option>';
    }).join('') + '</select>';
  }

  function addPiece(p) {
    p = p || { dia: 12, length: '', count: '', note: '' };
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + diaSelect(p.dia) + '</td>' +
      '<td><input name="length" type="number" inputmode="decimal" min="0.05" step="0.01" placeholder="e.g. 3.2" value="' + p.length + '" aria-label="Cut length in metres"></td>' +
      '<td><input name="count" type="number" inputmode="numeric" min="1" step="1" placeholder="e.g. 40" value="' + p.count + '" aria-label="Number of pieces"></td>' +
      '<td><input name="note" type="text" maxlength="40" placeholder="e.g. column bars" value="' + (p.note || '').replace(/"/g, '&quot;') + '" aria-label="Note"></td>' +
      '<td><button type="button" class="rc-x" aria-label="Remove this row">&times;</button></td>';
    piecesBody.appendChild(tr);
  }

  function addRun(r) {
    r = r || { dia: 12, length: '', lines: '', closed: false, note: '' };
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + diaSelect(r.dia) + '</td>' +
      '<td><input name="length" type="number" inputmode="decimal" min="0.1" step="0.01" placeholder="e.g. 74" value="' + r.length + '" aria-label="Run length in metres"></td>' +
      '<td><input name="lines" type="number" inputmode="numeric" min="1" step="1" placeholder="e.g. 4" value="' + r.lines + '" aria-label="Number of bar lines"></td>' +
      '<td class="rc-c"><input name="closed" type="checkbox"' + (r.closed ? ' checked' : '') + ' aria-label="Closed loop"></td>' +
      '<td><input name="note" type="text" maxlength="40" placeholder="e.g. ring beam" value="' + (r.note || '').replace(/"/g, '&quot;') + '" aria-label="Note"></td>' +
      '<td><button type="button" class="rc-x" aria-label="Remove this row">&times;</button></td>';
    runsBody.appendChild(tr);
  }

  form.addEventListener('click', function (e) {
    if (e.target.classList.contains('rc-x')) e.target.closest('tr').remove();
  });
  $('#rc-add-piece').addEventListener('click', function () { addPiece(); });
  $('#rc-add-run').addEventListener('click', function () { addRun(); });
  $('#rc-clear').addEventListener('click', function () {
    piecesBody.innerHTML = ''; runsBody.innerHTML = ''; addPiece(); resultsEl.hidden = true;
    setStatus('');
  });
  $('#rc-sample').addEventListener('click', function () {
    piecesBody.innerHTML = ''; runsBody.innerHTML = '';
    SAMPLE.pieces.forEach(addPiece);
    SAMPLE.runs.forEach(addRun);
    $('#rc-stock').value = '12'; $('#rc-lap').value = '50';
    setStatus('Sample loaded: the bar schedule of one two-bedroom bungalow. Press "Work out the plan".');
  });

  // A real two-bedroom bungalow schedule (cut lengths include bends).
  var SAMPLE = {
    pieces: [
      { dia: 8, length: 0.4, count: 180, note: 'rings and column links' },
      { dia: 8, length: 0.6, count: 40, note: 'rings and column links' },
      { dia: 8, length: 0.7, count: 297, note: 'ring beam links' },
      { dia: 12, length: 1.1, count: 90, note: 'column bases' },
      { dia: 12, length: 1.2, count: 24, note: 'column bases' },
      { dia: 12, length: 1.5, count: 44, note: 'column starters' },
      { dia: 12, length: 3.2, count: 44, note: 'columns' },
      { dia: 12, length: 0.6, count: 10, note: 'worktop slab' },
      { dia: 12, length: 1.8, count: 4, note: 'worktop slab' },
      { dia: 16, length: 1.2, count: 22, note: 'burglar proofing' },
      { dia: 16, length: 2.1, count: 54, note: 'burglar proofing' }
    ],
    runs: [{ dia: 12, length: 74, lines: 4, closed: false, note: 'ring beam main bars' }]
  };

  function setStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('rc-status--error', !!isError);
  }

  function readInputs() {
    var stock = C.mm($('#rc-stock').value);
    var lapD = Number($('#rc-lap').value);
    if (!(lapD >= 0 && lapD <= 100)) throw new Error('Lap length should be between 0 and 100 bar diameters.');
    var price = $('#rc-price').value === '' ? null : Number($('#rc-price').value);
    if (price !== null && !(price >= 0)) throw new Error('Price per kg must be a positive number.');
    var byDia = {};
    function bucket(d) { return byDia[d] = byDia[d] || { pieces: {}, full: 0, lap: d * lapD, notes: [] }; }
    var rows = 0;
    piecesBody.querySelectorAll('tr').forEach(function (tr, i) {
      var len = tr.querySelector('[name=length]').value, cnt = tr.querySelector('[name=count]').value;
      if (len === '' && cnt === '') return;
      var d = Number(tr.querySelector('[name=dia]').value);
      var L = C.mm(len), n = Number(cnt);
      if (!(n >= 1 && n === Math.floor(n))) throw new Error('Row ' + (i + 1) + ': the number of pieces must be a whole number.');
      if (L > stock) throw new Error('Row ' + (i + 1) + ': a ' + m(L) + ' m piece is longer than the ' + m(stock) + ' m bar. Enter it as a continuous bar below.');
      var b = bucket(d);
      b.pieces[L] = (b.pieces[L] || 0) + n;
      rows++;
    });
    runsBody.querySelectorAll('tr').forEach(function (tr, i) {
      var len = tr.querySelector('[name=length]').value, lines = tr.querySelector('[name=lines]').value;
      if (len === '' && lines === '') return;
      var d = Number(tr.querySelector('[name=dia]').value);
      var L = C.mm(len), n = Number(lines), closed = tr.querySelector('[name=closed]').checked;
      if (!(n >= 1 && n === Math.floor(n))) throw new Error('Continuous bar ' + (i + 1) + ': the number of lines must be a whole number.');
      var b = bucket(d);
      var r = C.runPieces(L, stock, b.lap, closed);
      b.full += r.full * n;
      if (r.rest) b.pieces[r.rest] = (b.pieces[r.rest] || 0) + n;
      b.notes.push(n + ' line' + (n > 1 ? 's' : '') + ' of ' + m(L) + ' m: ' + r.full + ' full bar' + (r.full === 1 ? '' : 's') +
        (r.rest ? ' and a ' + m(r.rest) + ' m closing piece' : '') + ' each, laps ' + m(b.lap) + ' m');
      rows++;
    });
    if (!rows) throw new Error('Add at least one piece to cut.');
    return { stock: stock, price: price, byDia: byDia };
  }

  var highsPromise = null;
  function loadSolver() {
    if (highsPromise) return highsPromise;
    highsPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'assets/vendor/highs/highs.js?v=1.15.3';
      s.onload = function () {
        var factory = window.Module;
        try { delete window.Module; } catch (e) { window.Module = undefined; }
        if (typeof factory !== 'function') { reject(new Error('The solver did not load.')); return; }
        factory({ locateFile: function (f) { return 'assets/vendor/highs/' + f + '?v=1.15.3'; } }).then(resolve, reject);
      };
      s.onerror = function () { reject(new Error('The solver could not be downloaded. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
    highsPromise.catch(function () { highsPromise = null; });
    return highsPromise;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input;
    try { input = readInputs(); } catch (err) { setStatus(err.message, true); return; }
    var btn = $('#rc-go');
    btn.disabled = true;
    setStatus('Loading the solver (about 1.2 MB, downloaded once)...');
    loadSolver().then(function (highs) {
      setStatus('Working out the plan...');
      return new Promise(function (r) { setTimeout(r, 30); }).then(function () { return solveAll(highs, input); });
    }).then(function (res) {
      lastResult = res;
      render(res);
      setStatus('Done. Every plan below is checked piece by piece and proven to use the fewest bars.');
    }).catch(function (err) {
      setStatus(err.message || String(err), true);
    }).then(function () { btn.disabled = false; });
  });

  function solveAll(highs, input) {
    var out = { stock: input.stock, price: input.price, rows: [] };
    Object.keys(input.byDia).map(Number).sort(function (a, b) { return a - b; }).forEach(function (d) {
      var b = input.byDia[d];
      var opt = C.optimise(highs, b.pieces, input.stock);
      var hasPieces = Object.keys(b.pieces).length > 0;
      var naive = hasPieces ? C.naiveBars(b.pieces, input.stock) : 0;
      var ffd = hasPieces ? C.firstFitDecreasing(b.pieces, input.stock).length : 0;
      var needMm = Object.keys(b.pieces).reduce(function (a, l) { return a + Number(l) * b.pieces[l]; }, 0) + b.full * input.stock;
      out.rows.push({
        dia: d, full: b.full, notes: b.notes, kgm: kgPerM(d),
        bars: opt.bars + b.full, naive: naive + b.full, ffd: ffd + b.full, lowerBound: opt.lowerBound + b.full,
        needMm: needMm, plan: C.summarise(opt.patterns, input.stock)
      });
    });
    return out;
  }

  function render(res) {
    var S = res.stock, money = res.price !== null;
    var tot = { bars: 0, naive: 0, kgBuy: 0, kgNeed: 0, kgNaive: 0 };
    var html = '';
    res.rows.forEach(function (r) {
      var kgBar = S / 1000 * r.kgm;
      var waste = r.bars ? 100 * (1 - r.needMm / (r.bars * S)) : 0;
      tot.bars += r.bars; tot.naive += r.naive;
      tot.kgBuy += r.bars * kgBar; tot.kgNeed += r.needMm / 1000 * r.kgm; tot.kgNaive += r.naive * kgBar;
      var proof = r.bars === r.lowerBound
        ? 'Matches the floor: the pieces add up to ' + fmt(r.needMm / 1000, 1) + ' m, which cannot fit in fewer than ' + r.lowerBound + ' bars.'
        : 'The solver proved no plan uses fewer than ' + r.bars + ' bars (the length floor alone is ' + r.lowerBound + ').';
      html += '<article class="rc-card">' +
        '<header class="rc-card__head"><h3>Y' + r.dia + ' bars</h3><span>' + fmt(r.kgm, 3) + ' kg/m</span></header>' +
        '<div class="rc-stats">' +
          '<div><b>' + r.bars + '</b><span>bars to buy</span></div>' +
          '<div><b>' + r.naive + '</b><span>if each length is cut from its own bars</span></div>' +
          '<div><b>' + fmt(waste, 1) + '%</b><span>offcut</span></div>' +
          (money ? '<div><b>GH&#8373; ' + fmt(r.bars * kgBar * res.price, 2) + '</b><span>steel cost</span></div>' : '') +
        '</div>' +
        '<p class="rc-proof">' + proof + '</p>' +
        (r.notes.length ? '<p class="rc-note">' + r.notes.join('<br>') + '</p>' : '') +
        '<div class="rc-tablewrap"><table class="rc-plan"><thead><tr><th>Bars</th><th>Cut each bar into (m)</th><th>Offcut (m)</th></tr></thead><tbody>' +
        (r.full ? '<tr><td>' + r.full + '</td><td>full ' + m(S) + ' m bars for the continuous lines</td><td>0</td></tr>' : '') +
        r.plan.map(function (p) {
          return '<tr><td>' + p.times + '</td><td>' + groupCuts(p.cuts) + '</td><td>' + m(p.offcut) + '</td></tr>';
        }).join('') +
        '</tbody></table></div></article>';
    });
    var saved = tot.naive - tot.bars;
    var head = '<div class="rc-total"><div><b>' + tot.bars + '</b><span>bars in total</span></div>' +
      '<div><b>' + fmt(tot.kgBuy, 0) + ' kg</b><span>to buy, for ' + fmt(tot.kgNeed, 0) + ' kg of cut steel</span></div>' +
      '<div><b>' + saved + '</b><span>bar' + (saved === 1 ? '' : 's') + ' fewer than cutting each length separately' +
      (money && saved > 0 ? ' (GH&#8373; ' + fmt((tot.kgNaive - tot.kgBuy) * res.price, 2) + ')' : '') + '</span></div></div>';
    $('#rc-out').innerHTML = head + html;
    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#rc-csv').addEventListener('click', function () {
    if (!lastResult) return;
    var lines = [['diameter_mm', 'bars', 'cuts_m', 'offcut_m']];
    lastResult.rows.forEach(function (r) {
      if (r.full) lines.push([r.dia, r.full, 'full bar', 0]);
      r.plan.forEach(function (p) { lines.push([r.dia, p.times, p.cuts.map(function (c) { return c / 1000; }).join(' + '), p.offcut / 1000]); });
    });
    var blob = new Blob([lines.map(function (l) { return l.join(','); }).join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'cutting-plan.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $('#rc-print').addEventListener('click', function () { window.print(); });

  addPiece();
})();
