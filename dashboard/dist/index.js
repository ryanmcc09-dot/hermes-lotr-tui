/* Lord of the Rings Dashboard Plugin - "One Dashboard to Rule Them All" v3.2 */
(function () {
  'use strict';

  function initPlugin() {
    const SDK = window.__HERMES_PLUGIN_SDK__;
    const PLUGINS = window.__HERMES_PLUGINS__;

    if (!SDK || !PLUGINS) {
      setTimeout(initPlugin, 500);
      return;
    }

    const React = SDK.React;
    const h = React.createElement;
    const { useState, useEffect, useMemo } = SDK.hooks;

    const GOLD = '#c9a84c';
    const FIRE = '#d4403a';
    const PARCHMENT = '#f5e6c8';
    const SHADOW = '#0c0a08';
    const GLOW = 'rgba(201, 168, 76, 0.3)';

    const QUOTES = [
      ["All we have to decide is what to do with the time that is given us.", "Gandalf"],
      ["Even the smallest person can change the course of the future.", "Galadriel"],
      ["Not all those who wander are lost.", "Bilbo Baggins"],
      ["The board is set, the pieces are moving.", "Gandalf"],
      ["A wizard is never late, nor is he early.", "Gandalf"],
      ["I will not say: do not weep; for not all tears are an evil.", "Gandalf"],
      ["Courage is found in unlikely places.", "Gildor"],
      ["There is some good in this world, and it's worth fighting for.", "Samwise Gamgee"],
      ["It's a dangerous business, Frodo, going out your door.", "Bilbo Baggins"],
      ["The Road goes ever on and on, down from the door where it began.", "Bilbo Baggins"],
    ];

    function SafeComponent(name, Component) {
      return function Wrapped(props) {
        try { return Component(props); }
        catch (e) {
          console.error('[lotr-theme] ' + name + ' render error:', e);
          return h('div', { style: { color: '#ff4444', padding: 8, fontSize: 12 } }, 'Error in ' + name);
        }
      };
    }

    function usePollingStatus() {
      const [status, setStatus] = useState(null);
      const [cronJobs, setCronJobs] = useState([]);
      const [sessions, setSessions] = useState([]);
      const [analytics, setAnalytics] = useState(null);
      const [lastError, setLastError] = useState(null);

      useEffect(function () {
        let cancelled = false;
        function fetchAll() {
          if (cancelled) return;
          Promise.all([
            SDK.api.getStatus().catch(function (e) { setLastError(e.message); return null; }),
            SDK.api.getCronJobs().catch(function () { return []; }),
            SDK.api.getSessions(20, 0).catch(function () { return { sessions: [] }; }),
            SDK.api.getAnalytics(7).catch(function () { return null; }),
          ]).then(function (results) {
            if (cancelled) return;
            setStatus(results[0]);
            setCronJobs(results[1] || []);
            setSessions((results[2] && results[2].sessions) ? results[2].sessions : []);
            setAnalytics(results[3]);
          });
        }
        fetchAll();
        const id = setInterval(fetchAll, 8000);
        return function () { cancelled = true; clearInterval(id); };
      }, []);

      return { status, cronJobs, sessions, analytics, lastError };
    }

    function timeAgo(ts) {
      if (!ts) return 'Never';
      var now = Date.now();
      var d = typeof ts === 'string' ? new Date(ts).getTime() : ts * 1000;
      var diff = Math.floor((now - d) / 1000);
      if (diff < 60) return diff + 's ago';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return Math.floor(diff / 86400) + 'd ago';
    }

    function nextRun(ts) {
      if (!ts) return 'Unknown';
      var d = typeof ts === 'string' ? new Date(ts).getTime() : ts * 1000;
      var diff = Math.floor((d - Date.now()) / 1000);
      if (diff < 60) return 'Soon';
      if (diff < 3600) return Math.floor(diff / 60) + 'm';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h';
      return Math.floor(diff / 86400) + 'd';
    }

    /* ============================================
       PALANTÍR FULL TAB PAGE (was MiddleEarthPage)
       ============================================ */
    function PalantirPageRaw() {
      const { status, cronJobs, sessions, analytics, lastError } = usePollingStatus();

      const fellowshipDetail = useMemo(function () {
        var base = [
          { name: 'Hermes', role: 'Ring-bearer', color: '#4ade80', status: 'ACTIVE', detail: 'Orchestrating' },
          { name: 'Ezra', role: 'Lore-master', color: '#4ade80', status: 'ACTIVE', detail: 'Researching' },
          { name: 'Abnett', role: 'Bard', color: '#a16207', status: 'RESTING', detail: 'Awaiting orders' },
          { name: 'Ed', role: 'Scribe', color: '#4ade80', status: 'ACTIVE', detail: 'Editing' },
          { name: 'Robin', role: 'Ranger', color: '#9ca3af', status: 'SCOUTING', detail: 'Patrolling' },
        ];
        if (!status) return base;
        base[0] = { ...base[0], color: status.gateway_running ? '#4ade80' : '#ff4444', status: status.gateway_running ? 'ACTIVE' : 'FALLEN', detail: status.gateway_running ? 'Gateway online' : 'Gateway lost' };

        function countAgentJobs(keywords) {
          return cronJobs.filter(function (j) {
            var p = (j.prompt || '').toLowerCase();
            return keywords.some(function (k) { return p.indexOf(k) !== -1; });
          });
        }
        var maps = [
          { jobs: countAgentJobs(['ezra', 'research']), idx: 1 },
          { jobs: countAgentJobs(['abnett', 'draft']), idx: 2 },
          { jobs: countAgentJobs(['ed-', 'editorial', 'publish']), idx: 3 },
          { jobs: countAgentJobs(['robin', 'trend', 'market']), idx: 4 },
        ];
        maps.forEach(function (m) {
          if (m.jobs.length > 0) {
            var active = m.jobs.filter(function (j) { return j.enabled; }).length;
            var f = base[m.idx];
            base[m.idx] = { ...f, color: active ? '#4ade80' : '#9ca3af', status: active ? 'ACTIVE' : 'RESTING', detail: active + ' quest' + (active === 1 ? '' : 's') + ' running' };
          }
        });
        return base;
      }, [status, cronJobs]);

      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px',
          minHeight: '80vh',
          gap: '16px',
          color: PARCHMENT,
        }
      }, [
        // ── Header ──
        h('div', {
          key: 'header',
          style: {
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(201,168,76,0.2)',
          }
        }, [
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
            h('div', {
              style: {
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2), rgba(212,64,58,0.5) 40%, rgba(12,10,8,0.95) 80%)',
                boxShadow: '0 0 20px -2px rgba(212,64,58,0.6), inset 0 0 8px rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(212,64,58,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
            }, h('div', { style: { width: '6px', height: '6px', borderRadius: '50%', background: '#fff', opacity: 0.6 } })),
            h('div', { style: { display: 'flex', flexDirection: 'column' } }, [
              h('span', { style: { fontFamily: 'Cinzel Decorative, Cinzel, serif', fontSize: '1.1rem', color: GOLD, letterSpacing: '0.1em' } }, 'The Palantír'),
              h('span', { style: { fontFamily: '"EB Garamond", serif', fontSize: '0.7rem', color: PARCHMENT, opacity: 0.4, fontStyle: 'italic' } }, 'Deep Sight into the Realm'),
            ]),
          ]),
          h('span', {
            style: {
              fontFamily: 'Cinzel, serif',
              fontSize: '0.6rem',
              color: status && status.gateway_running ? '#4ade80' : '#ff4444',
              letterSpacing: '0.1em',
              border: '1px solid ' + (status && status.gateway_running ? '#4ade8040' : '#ff444440'),
              padding: '3px 10px',
              borderRadius: '2px',
            }
          }, status && status.gateway_running ? 'CONNECTED' : 'LOST'),
        ]),

        // ── Grid ──
        h('div', {
          key: 'grid',
          style: {
            width: '100%',
            maxWidth: '900px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }
        }, [
          // Gateway Status
          h('div', {
            key: 'gw',
            style: {
              background: 'rgba(12,10,8,0.85)',
              border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '6px',
              padding: '16px',
            }
          }, [
            h('div', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.75rem', letterSpacing: '0.12em', color: GOLD, marginBottom: '12px' } }, '\u2726 Gateway Status'),
            status ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
                h('span', { style: { fontSize: '0.7rem', color: PARCHMENT, opacity: 0.6 } }, 'State'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: status.gateway_running ? '#4ade80' : '#ff4444' } }, status.gateway_running ? 'ONLINE' : 'OFFLINE'),
              ]),
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
                h('span', { style: { fontSize: '0.7rem', color: PARCHMENT, opacity: 0.6 } }, 'Version'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: PARCHMENT } }, status.version || 'Unknown'),
              ]),
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
                h('span', { style: { fontSize: '0.7rem', color: PARCHMENT, opacity: 0.6 } }, 'Active Conduits'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: PARCHMENT } }, String(status.active_sessions || 0)),
              ]),
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
                h('span', { style: { fontSize: '0.7rem', color: PARCHMENT, opacity: 0.6 } }, 'Process'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: PARCHMENT } }, status.gateway_pid ? 'PID ' + status.gateway_pid : 'None'),
              ]),
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
                h('span', { style: { fontSize: '0.7rem', color: PARCHMENT, opacity: 0.6 } }, 'Updated'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: PARCHMENT } }, status.gateway_updated_at ? timeAgo(status.gateway_updated_at) : '—'),
              ]),
            ]) : h('div', { style: { fontStyle: 'italic', fontSize: '0.75rem', color: PARCHMENT, opacity: 0.4, textAlign: 'center', padding: '20px' } }, 'The stone is dark...'),
          ]),

          // Fellowship
          h('div', {
            key: 'fellowship',
            style: {
              background: 'rgba(12,10,8,0.85)',
              border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '6px',
              padding: '16px',
            }
          }, [
            h('div', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.75rem', letterSpacing: '0.12em', color: GOLD, marginBottom: '12px' } }, '\u2726 Fellowship of the Agents'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
              fellowshipDetail.map(function (f) {
                return h('div', { key: f.name, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } }, [
                  h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 } }, [
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: PARCHMENT, fontWeight: 600 } }, f.name),
                    h('span', { style: { fontSize: '0.6rem', color: PARCHMENT, opacity: 0.45, fontStyle: 'italic' } }, f.role),
                  ]),
                  h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' } }, [
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: f.color, letterSpacing: '0.06em', whiteSpace: 'nowrap' } }, f.status),
                    h('span', { style: { fontSize: '0.55rem', color: PARCHMENT, opacity: 0.35, fontStyle: 'italic', whiteSpace: 'nowrap' } }, f.detail),
                  ]),
                ]);
              })
            ),
          ]),

          // Quest Log
          h('div', {
            key: 'quests',
            style: {
              background: 'rgba(12,10,8,0.85)',
              border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '6px',
              padding: '16px',
              gridColumn: '1 / -1',
            }
          }, [
            h('div', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.75rem', letterSpacing: '0.12em', color: GOLD, marginBottom: '12px' } }, '\u2694 Quest Log (' + cronJobs.length + ')'),
            cronJobs.length > 0 ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
              cronJobs.map(function (job) {
                return h('div', {
                  key: job.id,
                  style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    background: 'rgba(201,168,76,0.04)',
                    border: '1px solid rgba(201,168,76,0.08)',
                    borderRadius: '4px',
                  }
                }, [
                  h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 } }, [
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.68rem', color: PARCHMENT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, job.name || 'Unnamed Quest'),
                    h('span', { style: { fontSize: '0.6rem', color: PARCHMENT, opacity: 0.4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, (job.prompt || '').slice(0, 60)),
                  ]),
                  h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: PARCHMENT, opacity: 0.5, whiteSpace: 'nowrap' } }, job.schedule_display || job.schedule.kind),
                  h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: job.enabled ? '#4ade80' : '#9ca3af', letterSpacing: '0.06em', border: '1px solid ' + (job.enabled ? '#4ade80' : '#9ca3af') + '40', padding: '2px 8px', borderRadius: '2px', whiteSpace: 'nowrap' } }, job.enabled ? 'ACTIVE' : 'PAUSED'),
                  h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: PARCHMENT, opacity: 0.4, whiteSpace: 'nowrap', textAlign: 'right' } }, job.next_run_at ? 'Next: ' + nextRun(job.next_run_at) : '—'),
                ]);
              })
            ) : h('div', { style: { fontStyle: 'italic', fontSize: '0.75rem', color: PARCHMENT, opacity: 0.4, textAlign: 'center', padding: '20px' } }, 'No quests recorded in the scrolls.'),
          ]),

          // Active Conduits
          h('div', {
            key: 'conduits',
            style: {
              background: 'rgba(12,10,8,0.85)',
              border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '6px',
              padding: '16px',
              gridColumn: '1 / -1',
            }
          }, [
            h('div', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.75rem', letterSpacing: '0.12em', color: GOLD, marginBottom: '12px' } }, '\u2709 Active Conduits (' + sessions.length + ')'),
            sessions.length > 0 ? h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' } },
              sessions.slice(0, 8).map(function (s) {
                return h('div', {
                  key: s.id,
                  style: {
                    background: 'rgba(201,168,76,0.04)',
                    border: '1px solid rgba(201,168,76,0.08)',
                    borderRadius: '4px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }
                }, [
                  h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: PARCHMENT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, (s.title || s.preview || 'Untitled').slice(0, 30)),
                  h('span', { style: { fontSize: '0.58rem', color: PARCHMENT, opacity: 0.45 } }, 'Source: ' + (s.source || 'Unknown')),
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '2px' } }, [
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: s.is_active ? '#4ade80' : '#9ca3af', letterSpacing: '0.06em' } }, s.is_active ? 'LIVE' : 'CLOSED'),
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: PARCHMENT, opacity: 0.35 } }, timeAgo(s.last_active)),
                  ]),
                  h('div', { style: { display: 'flex', gap: '8px', marginTop: '2px' } }, [
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.5rem', color: PARCHMENT, opacity: 0.35 } }, 'Msgs: ' + (s.message_count || 0)),
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.5rem', color: PARCHMENT, opacity: 0.35 } }, 'Tools: ' + (s.tool_call_count || 0)),
                  ]),
                ]);
              })
            ) : h('div', { style: { fontStyle: 'italic', fontSize: '0.75rem', color: PARCHMENT, opacity: 0.4, textAlign: 'center', padding: '20px' } }, 'No conduits active in the realm.'),
          ]),

          // Analytics
          analytics ? h('div', {
            key: 'analytics',
            style: {
              background: 'rgba(12,10,8,0.85)',
              border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '6px',
              padding: '16px',
              gridColumn: '1 / -1',
            }
          }, [
            h('div', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.75rem', letterSpacing: '0.12em', color: GOLD, marginBottom: '12px' } }, '\u2726 Realm Ledger (7 Days)'),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' } }, [
              h('div', { style: { textAlign: 'center', padding: '10px', background: 'rgba(201,168,76,0.04)', borderRadius: '4px' } }, [
                h('div', { style: { fontFamily: 'Cinzel Decorative, Cinzel, serif', fontSize: '1.2rem', color: GOLD } }, String(analytics.totals.total_sessions || 0)),
                h('div', { style: { fontSize: '0.6rem', color: PARCHMENT, opacity: 0.5 } }, 'Sessions'),
              ]),
              h('div', { style: { textAlign: 'center', padding: '10px', background: 'rgba(201,168,76,0.04)', borderRadius: '4px' } }, [
                h('div', { style: { fontFamily: 'Cinzel Decorative, Cinzel, serif', fontSize: '1.2rem', color: GOLD } }, String(analytics.totals.total_api_calls || 0)),
                h('div', { style: { fontSize: '0.6rem', color: PARCHMENT, opacity: 0.5 } }, 'API Calls'),
              ]),
              h('div', { style: { textAlign: 'center', padding: '10px', background: 'rgba(201,168,76,0.04)', borderRadius: '4px' } }, [
                h('div', { style: { fontFamily: 'Cinzel Decorative, Cinzel, serif', fontSize: '1.2rem', color: GOLD } }, String(Math.round((analytics.totals.total_input || 0) / 1000) + 'K')),
                h('div', { style: { fontSize: '0.6rem', color: PARCHMENT, opacity: 0.5 } }, 'Input Tokens'),
              ]),
              h('div', { style: { textAlign: 'center', padding: '10px', background: 'rgba(201,168,76,0.04)', borderRadius: '4px' } }, [
                h('div', { style: { fontFamily: 'Cinzel Decorative, Cinzel, serif', fontSize: '1.2rem', color: GOLD } }, '$' + String((analytics.totals.total_estimated_cost || 0).toFixed(2))),
                h('div', { style: { fontSize: '0.6rem', color: PARCHMENT, opacity: 0.5 } }, 'Est. Cost'),
              ]),
            ]),
          ]) : null,

          // Skill Usage Chart
          analytics && analytics.skills && analytics.skills.top_skills && analytics.skills.top_skills.length > 0 ? h('div', {
            key: 'skills',
            style: {
              background: 'rgba(12,10,8,0.85)',
              border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '6px',
              padding: '16px',
              gridColumn: '1 / -1',
            }
          }, [
            h('div', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.75rem', letterSpacing: '0.12em', color: GOLD, marginBottom: '14px' } }, '\u2726 Skill Mastery (' + (analytics.skills.summary.distinct_skills_used || 0) + ' disciplines)'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
              analytics.skills.top_skills.slice(0, 8).map(function (sk) {
                var pct = sk.percentage || 0;
                return h('div', { key: sk.skill, style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: PARCHMENT, fontWeight: 600 } }, sk.skill),
                    h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: GOLD, opacity: 0.8 } }, sk.total_count + ' · ' + pct.toFixed(1) + '%'),
                  ]),
                  h('div', {
                    style: {
                      width: '100%',
                      height: '6px',
                      background: 'rgba(201,168,76,0.08)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }
                  }, [
                    h('div', {
                      style: {
                        width: pct + '%',
                        height: '100%',
                        background: 'linear-gradient(90deg, ' + GOLD + ', #e8c86a)',
                        borderRadius: '3px',
                        transition: 'width 0.8s ease',
                        boxShadow: '0 0 8px -2px ' + GLOW,
                      }
                    }),
                  ]),
                ]);
              })
            ),
            h('div', { style: { display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(201,168,76,0.08)' } }, [
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: PARCHMENT, opacity: 0.4 } }, 'Total Loads:'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: GOLD } }, String(analytics.skills.summary.total_skill_loads || 0)),
              ]),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: PARCHMENT, opacity: 0.4 } }, 'Edits:'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: GOLD } }, String(analytics.skills.summary.total_skill_edits || 0)),
              ]),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: PARCHMENT, opacity: 0.4 } }, 'Actions:'),
                h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: GOLD } }, String(analytics.skills.summary.total_skill_actions || 0)),
              ]),
            ]),
          ]) : null,
        ]),
      ]);
    }

    /* ============================================
       1. HEADER-LEFT: Ring Crest + Title
       ============================================ */
    function RingCrestRaw() {
      return h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '8px',
        }
      }, [
        h('svg', {
          key: 'ring',
          width: 22,
          height: 22,
          viewBox: '0 0 24 24',
          fill: 'none',
          style: { flexShrink: 0, animation: 'lotrPulse 4s ease-in-out infinite' }
        }, [
          h('circle', { cx: 12, cy: 12, r: 9, stroke: GOLD, strokeWidth: 1.2, opacity: 0.9 }),
          h('circle', { cx: 12, cy: 12, r: 5, stroke: '#b8962e', strokeWidth: 0.6, opacity: 0.4 }),
          h('circle', { cx: 12, cy: 12, r: 2, fill: GOLD, opacity: 0.15 }),
        ]),
        h('div', {
          key: 'text',
          style: { display: 'flex', flexDirection: 'column' }
        }, [
          h('span', {
            key: 't1',
            style: {
              fontFamily: 'Cinzel, serif',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              color: FIRE,
              opacity: 0.7,
              lineHeight: 1,
            }
          }, 'MIDDLE-EARTH'),
          h('span', {
            key: 't2',
            style: {
              fontFamily: 'Cinzel, serif',
              fontSize: '0.55rem',
              letterSpacing: '0.12em',
              color: PARCHMENT,
              opacity: 0.45,
              lineHeight: 1.2,
            }
          }, 'Command Center'),
        ]),
      ]);
    }

    /* ============================================
       2. SIDEBAR: Ring + Fellowship + Quest Log
       ============================================ */
    function SidebarPanelRaw() {
      const { status, cronJobs, sessions, lastError } = usePollingStatus();

      const fellowship = useMemo(function () {
        const base = [
          { name: 'Hermes', role: 'Ring-bearer', color: '#4ade80', status: 'ACTIVE' },
          { name: 'Ezra', role: 'Lore-master', color: '#4ade80', status: 'ACTIVE' },
          { name: 'Abnett', role: 'Bard', color: '#a16207', status: 'RESTING' },
          { name: 'Ed', role: 'Scribe', color: '#4ade80', status: 'ACTIVE' },
          { name: 'Robin', role: 'Ranger', color: '#9ca3af', status: 'SCOUTING' },
        ];
        if (status && status.gateway_running) {
          base[0] = { ...base[0], color: '#4ade80', status: 'ACTIVE' };
        }
        if (cronJobs.length > 0) {
          const active = cronJobs.filter(function (j) { return j.enabled; }).length;
          base[4] = { ...base[4], color: active ? '#4ade80' : '#9ca3af', status: active ? 'SCOUTING (' + active + ')' : 'RESTING' };
        }
        return base;
      }, [status, cronJobs]);

      const activeQuests = useMemo(function () {
        return (cronJobs || []).filter(function (j) { return j.enabled; }).slice(0, 3);
      }, [cronJobs]);

      const recentMessages = useMemo(function () {
        return (sessions || []).slice(0, 3);
      }, [sessions]);

      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          height: '100%',
          overflowY: 'auto',
          padding: '10px 8px',
          background: 'rgba(12,10,8,0.5)',
        }
      }, [
        h('div', {
          key: 'ring',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 6px',
          }
        }, [
          h('div', {
            style: {
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              border: '1.5px solid ' + GOLD,
              boxShadow: '0 0 28px -4px ' + GOLD + ', inset 0 0 20px -8px rgba(201,168,76,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              animation: 'lotrPulse 5s ease-in-out infinite',
            }
          }, [
            h('div', {
              style: {
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                border: '0.5px solid rgba(201,168,76,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
              }
            }, [
              h('span', {
                style: {
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.58rem',
                  letterSpacing: '0.12em',
                  color: GOLD,
                  opacity: 0.6,
                  textAlign: 'center',
                  lineHeight: 1.5,
                }
              }, 'ONE DASHBOARD TO RULE THEM ALL'),
            ]),
          ]),
        ]),

        h('div', {
          key: 'fellowship',
          style: {
            background: 'rgba(12,10,8,0.7)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: '4px',
            padding: '10px',
          }
        }, [
          h('div', {
            style: {
              fontFamily: 'Cinzel, serif',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              color: PARCHMENT,
              marginBottom: '10px',
              borderBottom: '1px solid rgba(201,168,76,0.15)',
              paddingBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }
          }, [
            h('span', { style: { color: GOLD, fontSize: '0.8rem' } }, '\u2726'),
            'Fellowship Status',
          ]),
        ].concat(fellowship.map(function (f) {
          return h('div', {
            key: f.name,
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              padding: '5px 0',
              borderBottom: '1px solid rgba(201,168,76,0.06)',
            }
          }, [
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 } }, [
              h('span', {
                style: { fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: PARCHMENT, fontWeight: 600 }
              }, f.name),
              h('span', {
                style: { fontFamily: '"EB Garamond", serif', fontSize: '0.6rem', color: PARCHMENT, opacity: 0.5, fontStyle: 'italic' }
              }, f.role),
            ]),
            h('span', {
              style: {
                backgroundColor: f.color + '15',
                color: f.color,
                border: '1px solid ' + f.color + '40',
                fontSize: '0.55rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: 'Cinzel, serif',
                padding: '2px 7px',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }
            }, f.status),
          ]);
        }))),

        activeQuests.length > 0 ? h('div', {
          key: 'quests',
          style: {
            background: 'rgba(12,10,8,0.7)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: '4px',
            padding: '10px',
          }
        }, [
          h('div', {
            style: {
              fontFamily: 'Cinzel, serif',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              color: PARCHMENT,
              marginBottom: '8px',
              borderBottom: '1px solid rgba(201,168,76,0.15)',
              paddingBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }
          }, [
            h('span', { style: { color: GOLD, fontSize: '0.8rem' } }, '\u2694'),
            'Active Quests',
          ]),
          activeQuests.map(function (job) {
            return h('div', {
              key: job.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0',
                fontSize: '0.6rem',
                color: PARCHMENT,
                opacity: 0.7,
              }
            }, [
              h('span', { style: { color: '#4ade80' } }, '\u25cf'),
              h('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, job.name || job.prompt.slice(0, 30)),
            ]);
          }),
        ]) : null,

        recentMessages.length > 0 ? h('div', {
          key: 'realm',
          style: {
            background: 'rgba(12,10,8,0.7)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: '4px',
            padding: '10px',
          }
        }, [
          h('div', {
            style: {
              fontFamily: 'Cinzel, serif',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              color: PARCHMENT,
              marginBottom: '8px',
              borderBottom: '1px solid rgba(201,168,76,0.15)',
              paddingBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }
          }, [
            h('span', { style: { color: GOLD, fontSize: '0.8rem' } }, '\u2709'),
            'Dispatches',
          ]),
          recentMessages.map(function (s) {
            return h('div', {
              key: s.id,
              style: {
                padding: '3px 0',
                fontSize: '0.58rem',
                color: PARCHMENT,
                opacity: 0.6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid rgba(201,168,76,0.05)',
              }
            }, (s.title || s.preview || 'Untitled session').slice(0, 35));
          }),
        ]) : null,

        lastError && lastError.includes('memory') ? h('div', {
          key: 'memory',
          style: {
            background: 'rgba(139,0,0,0.3)',
            border: '1px solid rgba(212,0,0,0.4)',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '0.6rem',
            color: '#ff8888',
            textAlign: 'center',
          }
        }, 
          h('span', { style: { fontFamily: 'Cinzel, serif', fontWeight: 600 } }, 'THE SHADOW GROWS'),
          h('div', null, 'Memory scarce — purge required')
        ) : null,

        h('div', {
          key: 'blurb',
          style: {
            marginTop: 'auto',
            paddingTop: '10px',
            fontFamily: '"EB Garamond", serif',
            fontSize: '0.65rem',
            color: GOLD,
            opacity: 0.35,
            lineHeight: 1.4,
            fontStyle: 'italic',
            textAlign: 'center',
            borderTop: '1px solid rgba(201,168,76,0.1)',
          }
        }, 'All that is gold does not glitter'),
      ]);
    }

    /* ============================================
       3. HEADER-BANNER: The Eye of Sauron
       ============================================ */
    function EyeOfSauronRaw() {
      const [blinking, setBlinking] = useState(false);

      useEffect(function () {
        function blink() {
          setBlinking(true);
          setTimeout(function () { setBlinking(false); }, 200);
          setTimeout(blink, Math.random() * 3000 + 5000);
        }
        const t = setTimeout(blink, 6000);
        return function () { clearTimeout(t); };
      }, []);

      return h('div', {
        style: {
          width: '100%',
          height: '3px',
          background: blinking
            ? 'radial-gradient(ellipse at 50% 50%, rgba(212,64,58,1) 0%, rgba(201,168,76,0.4) 30%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(212,64,58,0.7) 0%, rgba(201,168,76,0.15) 40%, transparent 80%)',
          transition: 'background 0.2s ease',
          marginBottom: '2px',
          position: 'relative',
          zIndex: 5,
        }
      });
    }

    /* ============================================
       4. HEADER-RIGHT: Palantír globe → nav to tab
       ============================================ */
    function PalantirRaw() {
      const { status } = usePollingStatus();
      const [sessionCount, setSessionCount] = useState(0);

      useEffect(function () {
        if (status) {
          setSessionCount(status.active_sessions || 0);
        }
      }, [status]);

      function goToPalantir() {
        window.history.pushState({}, '', '/lotr-theme');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }

      return h('div', {
        onClick: goToPalantir,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingRight: '12px',
          cursor: 'pointer',
          transition: 'opacity 0.2s ease',
        },
        onMouseEnter: function (e) { e.currentTarget.style.opacity = '1'; },
        onMouseLeave: function (e) { e.currentTarget.style.opacity = '0.85'; },
        title: 'Gaze into the Palantír',
      }, [
        h('div', {
          key: 'orb',
          style: {
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), rgba(212,64,58,0.4) 40%, rgba(12,10,8,0.9) 80%)',
            boxShadow: '0 0 12px -2px rgba(212,64,58,0.5), inset 0 0 6px rgba(255,255,255,0.1)',
            border: '1px solid rgba(212,64,58,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }, h('div', {
          style: {
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#fff',
            opacity: 0.5,
            animation: 'lotrPulse 3s ease-in-out infinite',
          }
        })),

        h('div', {
          key: 'text',
          style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }
        }, [
          h('span', {
            style: {
              fontFamily: 'Cinzel, serif',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              color: status && status.gateway_running ? '#4ade80' : '#ff4444',
              opacity: 0.8,
              lineHeight: 1.1,
            }
          }, status && status.gateway_running ? 'Palant\u00edr Connected' : 'Connection Lost'),
          h('span', {
            style: {
              fontFamily: '"EB Garamond", serif',
              fontSize: '0.55rem',
              color: PARCHMENT,
              opacity: 0.4,
              fontStyle: 'italic',
            }
          }, sessionCount + ' active conduit' + (sessionCount === 1 ? '' : 's')),
        ]),
      ]);
    }

    /* ============================================
       5. POST-MAIN: Tolkien Quote Rotator
       ============================================ */
    function QuotOfTheDayRaw() {
      const [idx, setIdx] = useState(0);
      const [fade, setFade] = useState(true);

      useEffect(function () {
        const interval = setInterval(function () {
          setFade(false);
          setTimeout(function () {
            setIdx(function (i) { return (i + 1) % QUOTES.length; });
            setFade(true);
          }, 800);
        }, 20000);
        return function () { clearInterval(interval); };
      }, []);

      return h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderTop: '1px solid rgba(201,168,76,0.12)',
          background: 'rgba(12,10,8,0.4)',
        }
      }, [
        h('span', {
          key: 'q',
          style: {
            fontFamily: '"EB Garamond", serif',
            fontSize: '0.8rem',
            fontStyle: 'italic',
            color: PARCHMENT,
            opacity: fade ? 0.6 : 0,
            transition: 'opacity 0.8s ease',
            textAlign: 'center',
            maxWidth: '600px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
        }, '"' + QUOTES[idx][0] + '"'),
        h('span', { key: 'sep', style: { color: GOLD, opacity: 0.3 } }, '\u2014'),
        h('span', {
          key: 'src',
          style: {
            fontFamily: 'Cinzel, serif',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            color: GOLD,
            opacity: 0.4,
            whiteSpace: 'nowrap',
          }
        }, QUOTES[idx][1]),
      ]);
    }

    /* ============================================
       6. BACKDROP: Middle-earth Map
       ============================================ */
    function MapBackdropRaw() {
      const [loaded, setLoaded] = useState(false);

      useEffect(function () {
        const img = new Image();
        img.onload = function () { setLoaded(true); };
        img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Middle-earth.jpg/1280px-Middle-earth.jpg';
      }, []);

      return h('div', {
        style: {
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: loaded ? 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Middle-earth.jpg/1280px-Middle-earth.jpg)' : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.05,
          mixBlendMode: 'luminosity',
          transition: 'opacity 1s ease',
        }
      });
    }

    /* ============================================
       7. OVERLAY: Darkness + Scanner FX
       ============================================ */
    function DarkOverlayRaw() {
      return h('div', {
        style: {
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          background: 'radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(0,0,0,0.6) 100%)',
          mixBlendMode: 'multiply',
        }
      });
    }

    // Wrap in error boundaries
    const RingCrest = SafeComponent('RingCrest', RingCrestRaw);
    const SidebarPanel = SafeComponent('SidebarPanel', SidebarPanelRaw);
    const EyeOfSauron = SafeComponent('EyeOfSauron', EyeOfSauronRaw);
    const Palantir = SafeComponent('Palantir', PalantirRaw);
    const QuotOfTheDay = SafeComponent('QuotOfTheDay', QuotOfTheDayRaw);
    const MapBackdrop = SafeComponent('MapBackdrop', MapBackdropRaw);
    const DarkOverlay = SafeComponent('DarkOverlay', DarkOverlayRaw);
    const PalantirTab = SafeComponent('PalantirTab', PalantirPageRaw);

    // Register the Palantír as the plugin tab
    try {
      PLUGINS.register('lotr-theme', PalantirTab);
      console.log('[lotr-theme] tab registered (Palantír page)');
    } catch (e) {
      console.error('[lotr-theme] tab register FAILED:', e);
    }

    // Register slots
    var slots = [
      ['header-left', RingCrest],
      ['header-banner', EyeOfSauron],
      ['header-right', Palantir],
      ['sidebar', SidebarPanel],
      ['post-main', QuotOfTheDay],
      ['backdrop', MapBackdrop],
      ['overlay', DarkOverlay],
    ];

    for (var i = 0; i < slots.length; i++) {
      try {
        PLUGINS.registerSlot('lotr-theme', slots[i][0], slots[i][1]);
        console.log('[lotr-theme] ' + slots[i][0] + ' registered');
      } catch (e) {
        console.error('[lotr-theme] ' + slots[i][0] + ' FAILED:', e);
      }
    }

    // Inject keyframe animations
    if (!document.getElementById('lotr-keyframes')) {
      var style = document.createElement('style');
      style.id = 'lotr-keyframes';
      style.textContent =
        '@keyframes lotrPulse {' +
        '  0%, 100% { opacity: 0.7; box-shadow: 0 0 16px -4px rgba(201,168,76,0.25); }' +
        '  50% { opacity: 1; box-shadow: 0 0 28px -2px rgba(201,168,76,0.5); }' +
        '}' +
        '@keyframes lotrFlicker {' +
        '  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 0.6; }' +
        '  20%, 24%, 55% { opacity: 1; }' +
        '}' +
        '@keyframes lotrFadeIn {' +
        '  from { opacity: 0; transform: scale(0.98); }' +
        '  to { opacity: 1; transform: scale(1); }' +
        '}';
      document.head.appendChild(style);
    }

    console.log('[lotr-theme] Middle-earth plugin v3.2 loaded successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlugin);
  } else {
    initPlugin();
  }
})();
