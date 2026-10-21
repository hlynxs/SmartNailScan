// screens/AdminScreen.js
// Admin dashboard for SmartNailScan, connected to the Flask /api/admin/* endpoints.
// Nothing is ever deleted: users, scans, and education topics are archived and can be restored.
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {brand, darkSurface} from '../theme';
import {useUser} from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = 'http://localhost:5000';
const REVIEW_THRESHOLD = 70;
const FALLBACK_COLOR = '#8E877D';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---- Design tokens (from theme.js; admin is always dark) -------------------
const C = {
  page: darkSurface.cream,
  panel: darkSurface.creamAlt,
  track: '#160E09',
  border: '#4A382B',
  sidebar: brand.chocolate,
  sidebarBorder: brand.caramel,
  text: darkSurface.espresso,
  muted: darkSurface.textSoft,
  accent: darkSurface.toffee,
  danger: brand.clay,
  ok: brand.moss,
};

const CONDITION_COLORS = {
  Healthy: brand.moss,
  Onychomycosis: brand.clay,
  Leukonychia: brand.sand,
  "Beau's lines": brand.caramel,
  Koilonychia: FALLBACK_COLOR,
};
const CONDITIONS = Object.keys(CONDITION_COLORS);

const NAV = [
  {key: 'overview', short: 'Overview', label: 'Overview', glyph: '▦'},
  {key: 'users', short: 'Users', label: 'Users', glyph: '☺\uFE0E'},
  {key: 'scans', short: 'Scans', label: 'Scan records', glyph: '⌗'},
  {key: 'education', short: 'Learn', label: 'Education', glyph: '▤'},
  {key: 'ai', short: 'AI', label: 'AI data', glyph: '✲'},
];

// ---- API helpers -----------------------------------------------------------
async function api(path, token, options = {}) {
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  if (!res.ok) {
    const err = new Error((body && body.error) || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return body;
}

function describeError(e) {
  if (e.status) return e.message;
  return 'Could not reach the server. Check that the backend is running and the phone is connected.';
}

function fmtDate(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const parts = iso.slice(0, 10).split('-').map(Number);
  const m = parts[1];
  const d = parts[2];
  if (!m || !d) return '';
  return `${MONTHS[m - 1]} ${d}`;
}

const normalizeScan = x => ({
  id: x.id,
  date: fmtDate(x.created_at),
  user: x.user_name || x.user_email || 'Unknown user',
  condition: x.condition || 'Unknown',
  confidence: Math.round(Number(x.confidence) || 0),
  archived: !!x.archived,
});

const normalizeTopic = t => ({
  id: t.id,
  title: t.title || '',
  body: t.description || '',
  titleFil: t.title_fil || '',
  bodyFil: t.description_fil || '',
  archived: !!t.archived,
});

// ---- Shared pieces ---------------------------------------------------------
function Sidebar({active, onSelect, onLogout}) {
  return (
    <View style={s.sidebar}>
      <Text style={s.brand}>NailScan</Text>
      <Text style={s.role}>Admin</Text>
      <View style={{marginTop: 18}}>
        {NAV.map(item => (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            style={[s.navItem, active === item.key && s.navActive]}>
            <Text style={s.navGlyph}>{item.glyph}</Text>
            <Text style={s.navLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onLogout} style={s.logoutSide}>
        <Text style={s.navLabel}>Log out</Text>
      </Pressable>
    </View>
  );
}

function BottomBar({active, onSelect, bottomInset}) {
  return (
    <View style={[s.bottomBar, {paddingBottom: Math.max(bottomInset, 8)}]}>
      {NAV.map(item => {
        const on = active === item.key;
        return (
          <Pressable key={item.key} onPress={() => onSelect(item.key)} style={s.tab}>
            <View style={[s.tabIcon, on && s.tabIconOn]}>
              <Text style={[s.tabGlyph, !on && {opacity: 0.7}]}>{item.glyph}</Text>
            </View>
            <Text style={[s.tabLabel, on && {color: C.text, fontWeight: '700'}]} numberOfLines={1}>
              {item.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const Header = ({title, hint}) => (
  <>
    <Text style={s.h1}>{title}</Text>
    <Text style={s.sub}>{hint}</Text>
  </>
);

const Panel = ({title, children, style}) => (
  <View style={[s.panel, style]}>
    {title ? <Text style={s.panelTitle}>{title}</Text> : null}
    {children}
  </View>
);

function StatCard({label, value, suffix = ''}) {
  return (
    <View style={s.statCell}>
      <View style={s.statCard}>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={s.statValue}>{(value || 0).toLocaleString()}{suffix}</Text>
      </View>
    </View>
  );
}

function BarRow({name, pct, color}) {
  return (
    <View style={s.barRow}>
      <Text style={s.barName} numberOfLines={1}>{name}</Text>
      <View style={s.barTrack}>
        <View style={[s.barFill, {width: `${pct}%`, backgroundColor: color}]} />
      </View>
      <Text style={s.barPct}>{pct}%</Text>
    </View>
  );
}

function Chip({condition}) {
  return (
    <View style={s.chip}>
      <View style={[s.dot, {backgroundColor: CONDITION_COLORS[condition] || FALLBACK_COLOR}]} />
      <Text style={s.chipText}>{condition}</Text>
    </View>
  );
}

function ScanRow({item, last}) {
  return (
    <View style={[s.row, !last && s.rowDivider]}>
      <Text style={s.scanDate}>{item.date}</Text>
      <Text style={[s.rowTitle, {flex: 1, marginRight: 8}]} numberOfLines={1}>{item.user}</Text>
      <Chip condition={item.condition} />
      <Text style={s.scanConf}>{item.confidence}%</Text>
    </View>
  );
}

function Segment({options, value, onChange}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}}>
      {options.map(o => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[s.seg, value === o.key && s.segActive]}>
          <Text style={[s.segText, value === o.key && {color: C.text}]}>{o.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Btn({label, onPress, tone = 'default'}) {
  return (
    <Pressable onPress={onPress} style={[s.btn, tone === 'danger' && s.btnDanger, tone === 'solid' && s.btnSolid]}>
      <Text style={[s.btnText, tone === 'danger' && {color: '#e7b5a5'}]}>{label}</Text>
    </Pressable>
  );
}

const STATUS_OPTIONS = [
  {key: 'active', label: 'Active'},
  {key: 'archived', label: 'Archived'},
  {key: 'all', label: 'All'},
];

// ---- Overview --------------------------------------------------------------
function Overview({stats, scans}) {
  const activeScans = scans.filter(x => !x.archived);
  const counts = stats.condition_breakdown || [];
  const total = counts.reduce((n, b) => n + b.count, 0);
  const breakdown = counts
    .map(b => ({name: b.condition, pct: total ? Math.round((b.count / total) * 100) : 0}))
    .sort((a, b) => b.pct - a.pct);
  const cards = [
    {label: 'Active users', value: stats.users_active},
    {label: 'Scan records', value: stats.scans_active},
    {label: 'Archived items', value: (stats.users_archived || 0) + (stats.scans_archived || 0) + (stats.education_archived || 0)},
    {label: 'Education topics', value: stats.education_active},
  ];
  return (
    <>
      <Header title="Overview" hint="How the system is doing right now" />
      <View style={s.statGrid}>
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </View>
      <Panel title="Condition breakdown">
        {breakdown.length === 0 ? (
          <Text style={s.muted}>No scans yet. The breakdown appears once users start scanning.</Text>
        ) : (
          breakdown.map(b => (
            <BarRow key={b.name} name={b.name} pct={b.pct} color={CONDITION_COLORS[b.name] || FALLBACK_COLOR} />
          ))
        )}
      </Panel>
      <Panel title="Latest scans">
        {activeScans.length === 0 ? (
          <Text style={s.muted}>No scans yet.</Text>
        ) : (
          activeScans.slice(0, 3).map((it, i, arr) => (
            <ScanRow key={it.id} item={it} last={i === arr.length - 1} />
          ))
        )}
      </Panel>
    </>
  );
}

// ---- Users: search, filter, archive / restore ------------------------------
function Users({users, me, onSetArchived}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('active');

  const list = useMemo(
    () =>
      users.filter(u => {
        if (filter === 'active' && u.archived) return false;
        if (filter === 'archived' && !u.archived) return false;
        const q = query.trim().toLowerCase();
        return !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      }),
    [users, query, filter],
  );

  const confirmArchive = u =>
    Alert.alert('Archive user', `${u.name || u.email} will lose access. You can restore them from the Archived list.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Archive', style: 'destructive', onPress: () => onSetArchived(u.id, true)},
    ]);

  return (
    <>
      <Header title="Users" hint="Archive accounts and restore them later" />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or email"
        placeholderTextColor={C.muted}
        style={s.input}
      />
      <Segment value={filter} onChange={setFilter} options={STATUS_OPTIONS} />
      <Panel>
        {list.length === 0 ? (
          <Text style={s.muted}>No users match. Try a different search or filter.</Text>
        ) : (
          list.map((u, i) => (
            <View key={u.id} style={[s.userRow, i < list.length - 1 && s.rowDivider]}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{((u.name || u.email || '?')[0] || '?').toUpperCase()}</Text>
              </View>
              <View style={{flex: 1, marginRight: 8}}>
                <Text style={s.rowTitle} numberOfLines={1}>{u.name || u.email}</Text>
                <Text style={s.small} numberOfLines={1}>{u.email}</Text>
                <Text style={s.small}>
                  Joined {fmtDate(u.created_at) || 'date unknown'} · {u.role === 'admin' ? 'Admin' : 'User'}
                </Text>
              </View>
              {u.email === me ? (
                <Text style={s.small}>You</Text>
              ) : u.archived ? (
                <Btn label="Restore" tone="solid" onPress={() => onSetArchived(u.id, false)} />
              ) : (
                <Btn label="Archive" tone="danger" onPress={() => confirmArchive(u)} />
              )}
            </View>
          ))
        )}
      </Panel>
    </>
  );
}

// ---- Scan records: filter by status and condition, archive / restore -------
function Scans({scans, onSetArchived}) {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('active');

  const list = scans.filter(x => {
    if (view === 'active' && x.archived) return false;
    if (view === 'archived' && !x.archived) return false;
    return filter === 'all' || x.condition === filter;
  });

  const confirmArchive = x =>
    Alert.alert(
      'Archive scan record',
      `${x.user}'s ${x.date} scan will be hidden from lists and statistics. You can restore it from the Archived list.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Archive', onPress: () => onSetArchived(x.id, true)},
      ],
    );

  return (
    <>
      <Header title="Scan records" hint="Archive scans and restore them later" />
      <Segment value={view} onChange={setView} options={STATUS_OPTIONS} />
      <Segment
        value={filter}
        onChange={setFilter}
        options={[{key: 'all', label: 'All conditions'}, ...CONDITIONS.map(c => ({key: c, label: c}))]}
      />
      <Panel>
        {list.length === 0 ? (
          <Text style={s.muted}>
            {scans.length === 0
              ? 'No scans yet. They appear here once users start scanning.'
              : 'No scans match. Try a different filter.'}
          </Text>
        ) : (
          list.map((it, i) => (
            <View key={it.id} style={i < list.length - 1 && s.rowDivider}>
              <ScanRow item={it} last />
              <View style={{alignItems: 'flex-end', paddingBottom: 10}}>
                {it.archived ? (
                  <Btn label="Restore" tone="solid" onPress={() => onSetArchived(it.id, false)} />
                ) : (
                  <Btn label="Archive" tone="danger" onPress={() => confirmArchive(it)} />
                )}
              </View>
            </View>
          ))
        )}
      </Panel>
    </>
  );
}

// ---- Education: add, edit, archive / restore topics ------------------------
function Education({topics, onSave, onSetArchived}) {
  const [editing, setEditing] = useState(null); // topic object, or {id: null} for new
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [titleFil, setTitleFil] = useState('');
  const [bodyFil, setBodyFil] = useState('');
  const [view, setView] = useState('active');
  const [saving, setSaving] = useState(false);

  const open = t => {
    setEditing(t);
    setTitle(t.title);
    setBody(t.body);
    setTitleFil(t.titleFil || '');
    setBodyFil(t.bodyFil || '');
  };
  const close = () => setEditing(null);

  const save = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing details', 'Add an English title and text before saving.');
      return;
    }
    setSaving(true);
    try {
      await onSave(editing, {
        title: title.trim(),
        description: body.trim(),
        title_fil: titleFil.trim(),
        description_fil: bodyFil.trim(),
      });
      close();
    } catch (e) {
      Alert.alert('Could not save', describeError(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmArchive = t =>
    Alert.alert(
      'Archive topic',
      `"${t.title}" will disappear from the app's Dashboard. You can restore it from the Archived list.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Archive', onPress: () => onSetArchived(t.id, true)},
      ],
    );

  const list = topics.filter(t => view === 'all' || (view === 'archived' ? t.archived : !t.archived));

  return (
    <>
      <Header title="Education" hint="Topics shown on the app's Dashboard" />
      {editing ? (
        <Panel title={editing.id ? 'Edit topic' : 'New topic'}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Topic title"
            placeholderTextColor={C.muted}
            style={s.input}
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="What should users learn?"
            placeholderTextColor={C.muted}
            multiline
            style={[s.input, {height: 100, textAlignVertical: 'top'}]}
          />
          <TextInput
            value={titleFil}
            onChangeText={setTitleFil}
            placeholder="Filipino title (optional)"
            placeholderTextColor={C.muted}
            style={s.input}
          />
          <TextInput
            value={bodyFil}
            onChangeText={setBodyFil}
            placeholder="Filipino text (optional)"
            placeholderTextColor={C.muted}
            multiline
            style={[s.input, {height: 100, textAlignVertical: 'top'}]}
          />
          <View style={{flexDirection: 'row'}}>
            <Btn label={saving ? 'Saving…' : 'Save topic'} tone="solid" onPress={saving ? () => {} : save} />
            <View style={{width: 8}} />
            <Btn label="Cancel" onPress={close} />
          </View>
        </Panel>
      ) : (
        <>
          <View style={{alignItems: 'flex-start', marginBottom: 12}}>
            <Btn label="Add topic" tone="solid" onPress={() => open({id: null, title: '', body: '', titleFil: '', bodyFil: ''})} />
          </View>
          <Segment value={view} onChange={setView} options={STATUS_OPTIONS} />
          {list.length === 0 ? (
            <Panel>
              <Text style={s.muted}>
                {view === 'archived'
                  ? 'Nothing archived. Archived topics show up here and can be restored anytime.'
                  : 'No topics yet. Add one to show it on the Dashboard.'}
              </Text>
            </Panel>
          ) : (
            list.map(t => (
              <Panel key={t.id}>
                <Text style={s.rowTitle}>{t.title}</Text>
                <Text style={[s.muted, {marginTop: 4, marginBottom: 12}]}>{t.body}</Text>
                <View style={{flexDirection: 'row'}}>
                  <Btn label="Edit" onPress={() => open(t)} />
                  <View style={{width: 8}} />
                  {t.archived ? (
                    <Btn label="Restore" tone="solid" onPress={() => onSetArchived(t.id, false)} />
                  ) : (
                    <Btn label="Archive" tone="danger" onPress={() => confirmArchive(t)} />
                  )}
                </View>
              </Panel>
            ))
          )}
        </>
      )}
    </>
  );
}

// ---- AI data: real numbers from saved scans; model info comes later --------
function AiData({scans}) {
  const active = scans.filter(x => !x.archived);
  const low = active.filter(x => x.confidence < REVIEW_THRESHOLD);
  const avg = active.length ? Math.round(active.reduce((n, x) => n + x.confidence, 0) / active.length) : 0;
  return (
    <>
      <Header title="AI data" hint="How the scanning model is performing" />
      <View style={s.statGrid}>
        <StatCard label="Avg. confidence" value={avg} suffix="%" />
        <StatCard label="Needs review" value={low.length} />
      </View>
      <Panel title="Current model">
        <Text style={s.muted}>
          No model is connected yet. Its name, version, and accuracy will show here once the trained
          model is deployed to the backend.
        </Text>
      </Panel>
      <Panel title={`Needs review (${low.length})`}>
        <Text style={[s.small, {marginBottom: 6}]}>Scans under {REVIEW_THRESHOLD}% confidence.</Text>
        {low.length === 0 ? (
          <Text style={s.muted}>No low-confidence scans right now.</Text>
        ) : (
          low.map((it, i) => <ScanRow key={it.id} item={it} last={i === low.length - 1} />)
        )}
      </Panel>
    </>
  );
}

// ---- Screen ----------------------------------------------------------------
export default function AdminScreen({navigation}) {
  const {user, logout} = useUser();
  const token = user?.token;
  const isAdmin = user?.role === 'admin';

  const [active, setActive] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const {width} = useWindowDimensions();
  const wide = width >= 700; // tablet / landscape => sidebar; phone => bottom tabs
  const insets = useSafeAreaInsets();

  const goToLogin = () => {
    logout();
    navigation.reset({index: 0, routes: [{name: 'Login'}]});
  };
  const goToLoginRef = useRef(goToLogin);
  goToLoginRef.current = goToLogin;

  const sessionEnded = () =>
    Alert.alert('Session ended', 'Please log in again.', [
      {text: 'OK', onPress: () => goToLoginRef.current()},
    ]);

  const loadAll = useCallback(async () => {
    try {
      const [stats, users, scans, topics] = await Promise.all([
        api('/api/admin/stats', token),
        api('/api/admin/users?status=all', token),
        api('/api/admin/scans?status=all', token),
        api('/api/admin/education?status=all', token),
      ]);
      setData({
        stats,
        users: users.map(u => ({...u, archived: !!u.archived})),
        scans: scans.map(normalizeScan),
        topics: topics.map(normalizeTopic),
      });
      setError('');
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        Alert.alert('Session ended', 'Please log in again.', [
          {text: 'OK', onPress: () => goToLoginRef.current()},
        ]);
      } else {
        setError(describeError(e));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin) {
      navigation.reset({index: 0, routes: [{name: 'Landing'}]});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && token) loadAll();
  }, [loadAll, isAdmin, token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const retry = () => {
    setLoading(true);
    loadAll();
  };

  const setArchived = async (kind, id, archived) => {
    try {
      await api(`/api/admin/${kind}/${id}/${archived ? 'archive' : 'restore'}`, token, {method: 'POST'});
      await loadAll();
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        sessionEnded();
      } else {
        Alert.alert('Could not update', describeError(e));
      }
    }
  };

  const saveTopic = async (topic, fields) => {
    if (topic.id) {
      await api(`/api/admin/education/${topic.id}`, token, {method: 'PATCH', body: JSON.stringify(fields)});
    } else {
      await api('/api/admin/education', token, {method: 'POST', body: JSON.stringify(fields)});
    }
    await loadAll();
  };

  if (!isAdmin) return null;

  let content;
  if (!data) {
    content = loading ? (
      <View style={s.center}>
        <LoadingSpinner size={9} color={C.text} />
      </View>
    ) : (
      <Panel title="Couldn't load the dashboard">
        <Text style={s.muted}>{error}</Text>
        <View style={{marginTop: 12, alignItems: 'flex-start'}}>
          <Btn label="Try again" tone="solid" onPress={retry} />
        </View>
      </Panel>
    );
  } else {
    switch (active) {
      case 'users':
        content = (
          <Users users={data.users} me={user?.email} onSetArchived={(id, a) => setArchived('users', id, a)} />
        );
        break;
      case 'scans':
        content = <Scans scans={data.scans} onSetArchived={(id, a) => setArchived('scans', id, a)} />;
        break;
      case 'education':
        content = (
          <Education
            topics={data.topics}
            onSave={saveTopic}
            onSetArchived={(id, a) => setArchived('education', id, a)}
          />
        );
        break;
      case 'ai':
        content = <AiData scans={data.scans} />;
        break;
      default:
        content = <Overview stats={data.stats} scans={data.scans} />;
    }
  }

  const handleLogout = () =>
    Alert.alert('Log out', 'You will need to sign in again to use the admin dashboard.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log out', style: 'destructive', onPress: goToLogin},
    ]);

  const body = (
    <ScrollView
      style={{flex: 1}}
      contentContainerStyle={s.mainContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={C.text}
          colors={[brand.caramel]}
          progressBackgroundColor={C.panel}
        />
      }>
      {data && error ? <Text style={s.banner}>{error}</Text> : null}
      {content}
    </ScrollView>
  );

  return (
    <View style={[s.page, {paddingTop: insets.top}]}>
      {wide ? (
        <View style={[s.shell, {flexDirection: 'row'}]}>
          <Sidebar active={active} onSelect={setActive} onLogout={handleLogout} />
          {body}
        </View>
      ) : (
        <View style={s.shell}>
          <View style={s.phoneHeader}>
            <View>
              <Text style={s.brand}>NailScan</Text>
              <Text style={s.role}>Admin</Text>
            </View>
            <Pressable onPress={handleLogout} style={s.logoutTop}>
              <Text style={s.navLabel}>Log out</Text>
            </Pressable>
          </View>
          {body}
          <BottomBar active={active} onSelect={setActive} bottomInset={insets.bottom} />
        </View>
      )}
    </View>
  );
}

// ---- Styles ----------------------------------------------------------------
const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: C.page},
  shell: {flex: 1, backgroundColor: C.page},

  sidebar: {width: 190, backgroundColor: C.sidebar, padding: 18},
  brand: {color: C.text, fontSize: 17, fontWeight: '700'},
  role: {color: C.accent, fontSize: 12, marginTop: 2},
  navItem: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.sidebarBorder,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 8,
  },
  navActive: {backgroundColor: 'rgba(255,255,255,0.12)'},
  navGlyph: {color: C.text, fontSize: 14, marginRight: 8},
  navLabel: {color: C.text, fontSize: 14, fontWeight: '500'},

  phoneHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.sidebar, paddingHorizontal: 18, paddingVertical: 12,
  },
  logoutTop: {
    borderWidth: 1, borderColor: C.sidebarBorder, borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  logoutSide: {
    marginTop: 'auto', borderWidth: 1, borderColor: C.sidebarBorder,
    borderRadius: 12, paddingVertical: 11, alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row', backgroundColor: C.sidebar, borderTopWidth: 1,
    borderTopColor: C.sidebarBorder, paddingTop: 8,
  },
  tab: {flex: 1, alignItems: 'center'},
  tabIcon: {width: 48, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  tabIconOn: {backgroundColor: 'rgba(255,255,255,0.16)'},
  tabGlyph: {color: C.text, fontSize: 16},
  tabLabel: {color: C.muted, fontSize: 11, marginTop: 3},

  mainContent: {padding: 18, paddingBottom: 40},
  center: {paddingTop: 80, alignItems: 'center'},
  banner: {
    color: '#e7b5a5', fontSize: 13, backgroundColor: C.panel, borderWidth: 1,
    borderColor: C.danger, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  h1: {color: C.text, fontSize: 22, fontWeight: '700'},
  sub: {color: C.muted, fontSize: 13, marginTop: 2, marginBottom: 16},
  muted: {color: C.muted, fontSize: 14, lineHeight: 20},
  small: {color: C.muted, fontSize: 12, marginTop: 1},

  statGrid: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 4},
  statCell: {width: '50%', padding: 5},
  statCard: {backgroundColor: C.panel, borderRadius: 14, padding: 14},
  statLabel: {color: C.muted, fontSize: 12},
  statValue: {color: C.text, fontSize: 26, fontWeight: '600', marginTop: 4},

  panel: {
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, padding: 16, marginTop: 12,
  },
  panelTitle: {color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 12},

  barRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  barName: {color: C.text, fontSize: 13, fontWeight: '500', width: 104},
  barTrack: {flex: 1, height: 6, borderRadius: 3, backgroundColor: C.track, overflow: 'hidden', marginHorizontal: 10},
  barFill: {height: 6, borderRadius: 3},
  barPct: {color: C.muted, fontSize: 13, width: 38, textAlign: 'right'},

  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  rowDivider: {borderBottomWidth: 1, borderBottomColor: C.border},
  rowTitle: {color: C.text, fontSize: 14, fontWeight: '600'},
  scanDate: {color: C.muted, fontSize: 13, width: 44},
  scanConf: {color: C.muted, fontSize: 13, width: 40, textAlign: 'right'},
  chip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border,
    borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10,
  },
  dot: {width: 7, height: 7, borderRadius: 4, marginRight: 6},
  chipText: {color: C.text, fontSize: 12, fontWeight: '500'},

  userRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.sidebar,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: {color: C.text, fontWeight: '700', fontSize: 15},

  input: {
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 12,
    color: C.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 12,
  },
  seg: {
    borderWidth: 1, borderColor: C.border, borderRadius: 999,
    paddingVertical: 7, paddingHorizontal: 14, marginRight: 8,
  },
  segActive: {backgroundColor: C.sidebar, borderColor: C.sidebarBorder},
  segText: {color: C.muted, fontSize: 13, fontWeight: '500'},

  btn: {borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14},
  btnSolid: {backgroundColor: C.sidebar, borderColor: C.sidebarBorder},
  btnDanger: {borderColor: C.danger},
  btnText: {color: C.text, fontSize: 13, fontWeight: '600'},
});