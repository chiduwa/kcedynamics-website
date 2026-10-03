/* KCE Dynamics rebar cutting optimiser: the engine.
 *
 * Finds the fewest stock bars that yield every piece on a cutting list, and
 * proves it. Same model as the Python version in the optimisation portfolio
 * (arc-flow formulation, solved by HiGHS compiled to WebAssembly), and tested
 * against it. Lengths are whole millimetres throughout, so rounding can never
 * make a plan that fits on paper overrun the bar on site.
 *
 * Works in the browser (window.KCECut) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  function mm(metres) {
    var v = Math.round(Number(metres) * 1000);
    if (!isFinite(v) || v <= 0) throw new Error('Lengths must be positive numbers of metres.');
    if (Math.abs(v - Number(metres) * 1000) > 1e-6) throw new Error(metres + ' m is not a whole number of millimetres.');
    return v;
  }

  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }

  // A continuous bar line longer than a stock bar: full bars plus one closing
  // piece, with every joint lapped by lapMm. Open run: bars - 1 laps.
  function runPieces(lengthMm, stockMm, lapMm, closedLoop) {
    if (lapMm >= stockMm) throw new Error('The lap must be shorter than a stock bar.');
    if (!closedLoop && lengthMm <= stockMm) return { full: 0, rest: lengthMm };
    var reach = stockMm - lapMm, bars, total;
    if (closedLoop) {
      bars = Math.ceil(lengthMm / reach);
      total = lengthMm + bars * lapMm;
    } else {
      bars = 1 + Math.ceil((lengthMm - stockMm) / reach);
      total = lengthMm + (bars - 1) * lapMm;
    }
    var full = Math.floor(total / stockMm), rest = total - full * stockMm;
    return { full: full, rest: rest > 0 ? rest : null };
  }

  function lowerBound(pieces, stock) {
    var total = 0;
    Object.keys(pieces).forEach(function (l) { total += Number(l) * pieces[l]; });
    return Math.ceil(total / stock);
  }

  function naiveBars(pieces, stock) {
    var n = 0;
    Object.keys(pieces).forEach(function (l) {
      var per = Math.floor(stock / Number(l));
      if (per === 0) throw new Error('A ' + (l / 1000) + ' m piece is longer than the stock bar.');
      n += Math.ceil(pieces[l] / per);
    });
    return n;
  }

  function firstFitDecreasing(pieces, stock) {
    var lengths = Object.keys(pieces).map(Number).sort(function (a, b) { return b - a; });
    var bars = [], room = [];
    lengths.forEach(function (l) {
      for (var c = 0; c < pieces[l]; c++) {
        var placed = false;
        for (var b = 0; b < room.length; b++) {
          if (room[b] >= l) { bars[b].push(l); room[b] -= l; placed = true; break; }
        }
        if (!placed) { bars.push([l]); room.push(stock - l); }
      }
    });
    return bars;
  }

  // Arc-flow graph with the usual symmetry reduction: items longest first, and
  // an item's arcs start only at nodes reachable with items at least as long.
  function buildGraph(pieces, stock) {
    var lengths = Object.keys(pieces).map(Number).sort(function (a, b) { return b - a; });
    var g = lengths.reduce(gcd, stock);
    var L = lengths.map(function (l) { return l / g; }), W = stock / g;
    var reach = { 0: true }, arcs = [], seen = {};
    L.forEach(function (lk, idx) {
      var k = idx + 1, cap = Math.min(pieces[lengths[idx]], Math.floor(W / lk));
      var frontier = Object.keys(reach).map(Number), added = {};
      for (var step = 0; step < cap && frontier.length; step++) {
        var next = [];
        frontier.forEach(function (u) {
          var v = u + lk;
          if (v <= W) {
            var key = u + ',' + v + ',' + k;
            if (!seen[key]) { seen[key] = true; arcs.push([u, v, k]); }
            if (!added[v]) { added[v] = true; next.push(v); }
          }
        });
        frontier = next;
      }
      Object.keys(added).forEach(function (v) { reach[v] = true; });
    });
    Object.keys(reach).map(Number).forEach(function (u) { if (u < W) arcs.push([u, W, 0]); });
    var nodes = Object.keys(reach).map(Number);
    if (!reach[W]) nodes.push(W);
    nodes.sort(function (a, b) { return a - b; });
    return { g: g, W: W, lengths: lengths, scaled: L, nodes: nodes, arcs: arcs };
  }

  // CPLEX-LP text for HiGHS. stage 1: fewest bars. stage 2: at that count,
  // fewest bars carrying an offcut, so waste gathers into reusable pieces.
  function lpText(G, pieces, stage, barCap) {
    var out = [], into = {}, from = {}, byItem = {};
    G.arcs.forEach(function (a, i) {
      (from[a[0]] = from[a[0]] || []).push(i);
      (into[a[1]] = into[a[1]] || []).push(i);
      if (a[2] > 0) (byItem[a[2]] = byItem[a[2]] || []).push(i);
    });
    var loss = [];
    G.arcs.forEach(function (a, i) { if (a[2] === 0) loss.push('f' + i); });
    out.push('Minimize');
    out.push(stage === 1 ? ' obj: z' : ' obj: ' + (loss.length ? loss.join(' + ') : '0 z'));
    out.push('Subject To');
    G.nodes.forEach(function (n) {
      var terms = [];
      (into[n] || []).forEach(function (i) { terms.push('+ f' + i); });
      (from[n] || []).forEach(function (i) { terms.push('- f' + i); });
      if (n === 0) terms.push('+ z');
      if (n === G.W) terms.push('- z');
      if (terms.length) out.push(' n' + n + ': ' + terms.join(' ') + ' = 0');
    });
    G.lengths.forEach(function (l, idx) {
      var arcsK = byItem[idx + 1] || [];
      out.push(' d' + (idx + 1) + ': ' + arcsK.map(function (i) { return 'f' + i; }).join(' + ') + ' = ' + pieces[l]);
    });
    if (stage === 2) out.push(' cap: z <= ' + barCap);
    out.push('Bounds');
    out.push(' z >= 0');
    G.arcs.forEach(function (a, i) { out.push(' f' + i + ' >= 0'); });
    out.push('General');
    var ints = ['z'];
    G.arcs.forEach(function (a, i) { ints.push('f' + i); });
    for (var s = 0; s < ints.length; s += 40) out.push(' ' + ints.slice(s, s + 40).join(' '));
    out.push('End');
    return out.join('\n');
  }

  function decompose(G, flows) {
    var out = {};
    G.arcs.forEach(function (a, i) {
      var f = flows[i] || 0;
      if (Math.abs(f - Math.round(f)) > 1e-6) throw new Error('Solver returned a fractional plan.');
      f = Math.round(f);
      if (f > 0) (out[a[0]] = out[a[0]] || []).push({ v: a[1], k: a[2], f: f });
    });
    var patterns = [];
    for (;;) {
      var start = (out[0] || []).filter(function (e) { return e.f > 0; });
      if (!start.length) break;
      var path = [], u = 0;
      while (u !== G.W) {
        var e = (out[u] || []).filter(function (x) { return x.f > 0; })[0];
        if (!e) throw new Error('Plan does not decompose into whole bars.');
        path.push(e); u = e.v;
      }
      var amt = Math.min.apply(null, path.map(function (e) { return e.f; }));
      path.forEach(function (e) { e.f -= amt; });
      var cuts = path.filter(function (e) { return e.k > 0; }).map(function (e) { return G.lengths[e.k - 1]; });
      for (var c = 0; c < amt; c++) patterns.push(cuts);
    }
    return patterns;
  }

  function checkPatterns(patterns, pieces, stock) {
    var made = {};
    patterns.forEach(function (p) {
      var s = p.reduce(function (a, b) { return a + b; }, 0);
      if (s > stock) throw new Error('A planned bar overruns the stock length.');
      p.forEach(function (l) { made[l] = (made[l] || 0) + 1; });
    });
    Object.keys(pieces).forEach(function (l) {
      if ((made[l] || 0) !== pieces[l]) throw new Error('The plan cuts ' + (made[l] || 0) + ' pieces of ' + (l / 1000) + ' m, not ' + pieces[l] + '.');
    });
  }

  function solveWith(highs, lp) {
    var sol = highs.solve(lp, { mip_rel_gap: 0, mip_abs_gap: 0.5, time_limit: 60 });
    if (sol.Status !== 'Optimal') throw new Error('The solver stopped without proving an optimum (' + sol.Status + ').');
    return sol;
  }

  // pieces: { lengthMm: count }. Returns the proven minimum and its plan.
  function optimise(highs, pieces, stock) {
    var keys = Object.keys(pieces).filter(function (l) { return pieces[l] > 0; });
    if (!keys.length) return { bars: 0, patterns: [], lowerBound: 0 };
    var clean = {};
    keys.forEach(function (l) {
      if (Number(l) > stock) throw new Error('A ' + (l / 1000) + ' m piece is longer than the ' + (stock / 1000) + ' m bar.');
      if (!(pieces[l] === Math.floor(pieces[l]))) throw new Error('Piece counts must be whole numbers.');
      clean[l] = pieces[l];
    });
    var G = buildGraph(clean, stock);
    var s1 = solveWith(highs, lpText(G, clean, 1));
    var bars = Math.round(s1.ObjectiveValue);
    var s2 = solveWith(highs, lpText(G, clean, 2, bars));
    var flows = G.arcs.map(function (a, i) { return s2.Columns['f' + i] ? s2.Columns['f' + i].Primal : 0; });
    var patterns = decompose(G, flows);
    if (patterns.length !== bars) throw new Error('Plan has ' + patterns.length + ' bars, solver said ' + bars + '.');
    checkPatterns(patterns, clean, stock);
    var lb = lowerBound(clean, stock);
    if (bars < lb) throw new Error('Impossible result: fewer bars than the total length allows.');
    return { bars: bars, patterns: patterns, lowerBound: lb, graph: { nodes: G.nodes.length, arcs: G.arcs.length } };
  }

  function summarise(patterns, stock) {
    var groups = {};
    patterns.forEach(function (p) {
      var key = p.slice().sort(function (a, b) { return b - a; }).join('+');
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.keys(groups).map(function (key) {
      var cuts = key ? key.split('+').map(Number) : [];
      var used = cuts.reduce(function (a, b) { return a + b; }, 0);
      return { times: groups[key], cuts: cuts, offcut: stock - used };
    }).sort(function (a, b) { return b.times - a.times || a.offcut - b.offcut; });
  }

  var api = { mm: mm, runPieces: runPieces, lowerBound: lowerBound, naiveBars: naiveBars,
              firstFitDecreasing: firstFitDecreasing, buildGraph: buildGraph, lpText: lpText,
              decompose: decompose, checkPatterns: checkPatterns, optimise: optimise, summarise: summarise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KCECut = api;
})(typeof window !== 'undefined' ? window : this);
