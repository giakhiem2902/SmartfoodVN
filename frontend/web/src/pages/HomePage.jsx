import React from 'react';
import { Button, Row, Col, Card, Typography, Space } from 'antd';
import {
  ThunderboltOutlined, ClockCircleOutlined,
  SafetyOutlined, StarFilled, RightOutlined, GiftOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

const { Title, Text, Paragraph } = Typography;

// ─── DATA ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { icon: '🍚', label: 'Cơm', color: '#fff3e0', border: '#ff9800' },
  { icon: '🍜', label: 'Bún & Phở', color: '#fce4ec', border: '#e91e63' },
  { icon: '🍗', label: 'Gà rán', color: '#e8f5e9', border: '#4caf50' },
  { icon: '🍕', label: 'Pizza', color: '#e3f2fd', border: '#2196f3' },
  { icon: '🥗', label: 'Chay', color: '#f3e5f5', border: '#9c27b0' },
  { icon: '🍰', label: 'Tráng miệng', color: '#fff8e1', border: '#ffc107' },
  { icon: '🥤', label: 'Đồ uống', color: '#e0f7fa', border: '#00bcd4' },
  { icon: '🍱', label: 'Cơm hộp', color: '#fbe9e7', border: '#ff5722' },
];

const HOW_IT_WORKS = [
  {
    icon: '📍', step: '01',
    title: 'Bật vị trí',
    desc: 'Cho phép ứng dụng truy cập vị trí để tìm quán ăn gần bạn nhất',
    color: '#ff6b35',
  },
  {
    icon: '🍽️', step: '02',
    title: 'Chọn món yêu thích',
    desc: 'Duyệt thực đơn từ hàng chục quán ăn ngon quanh bạn',
    color: '#1890ff',
  },
  {
    icon: '🛵', step: '03',
    title: 'Đặt hàng & giao nhanh',
    desc: 'Đặt trong 30 giây, tài xế giao tận nơi siêu nhanh',
    color: '#52c41a',
  },
];

const FEATURES = [
  { icon: <ThunderboltOutlined style={{ fontSize: 28, color: '#ff6b35' }} />, title: 'Giao hàng siêu tốc', desc: 'Trung bình chỉ 25–35 phút' },
  { icon: <SafetyOutlined style={{ fontSize: 28, color: '#1890ff' }} />, title: 'Đảm bảo chất lượng', desc: 'Quán ăn được kiểm duyệt kỹ' },
  { icon: <GiftOutlined style={{ fontSize: 28, color: '#52c41a' }} />, title: 'Ưu đãi mỗi ngày', desc: 'Khuyến mãi cập nhật liên tục' },
  { icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#722ed1' }} />, title: 'Mở cửa 24/7', desc: 'Đặt bất cứ lúc nào bạn muốn' },
];

const TESTIMONIALS = [
  { name: 'Minh Tuấn', avatar: '👨‍💻', stars: 5, text: 'Giao hàng nhanh, món ăn còn nóng hổi, sẽ dùng mãi!' },
  { name: 'Thu Hương', avatar: '👩‍🦰', stars: 5, text: 'App dễ dùng, nhiều quán ngon, khuyến mãi xịn lắm!' },
  { name: 'Văn Khoa', avatar: '🧑‍🎓', stars: 5, text: 'Sinh viên mà dùng SmartFood là không lo đói bao giờ 😄' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* ══════════════ HERO ══════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #fff5f0 0%, #fff 60%, #fff8f0 100%)',
        padding: '60px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #ffe4cc',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,107,53,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,107,53,0.05)' }} />
        <div style={{ position: 'absolute', top: 40, right: '18%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,107,53,0.06)' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <Row align="middle" gutter={[40, 40]}>
            <Col xs={24} md={14}>
              {/* greeting badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fff3ee', border: '1px solid #ffcba8',
                borderRadius: 100, padding: '6px 16px', marginBottom: 20,
              }}>
                <span>👋</span>
                <Text style={{ color: '#ff6b35', fontWeight: 600, fontSize: 14 }}>
                  {greeting}, {user?.username || 'bạn'}!
                </Text>
              </div>

              <Title style={{
                fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800,
                lineHeight: 1.15, marginBottom: 16, color: '#1a1a1a',
              }}>
                Đặt đồ ăn ngon,{' '}
                <span style={{
                  color: '#ff6b35',
                  background: 'linear-gradient(90deg, #ff6b35, #ff9a5c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  giao tận nơi
                </span>{' '}
                siêu tốc 🚀
              </Title>

              <Paragraph style={{ fontSize: 17, color: '#666', marginBottom: 32, lineHeight: 1.7 }}>
                Hàng chục quán ăn ngon tại <strong>Thủ Đức, TP.HCM</strong> chỉ cách bạn một cú nhấp.<br />
                Giao hàng nhanh, tươi ngon, giá cả phải chăng.
              </Paragraph>

              {/* CTA buttons */}
              <Space size={12} wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingOutlined />}
                  onClick={() => navigate('/stores')}
                  style={{
                    background: 'linear-gradient(135deg, #ff6b35, #ff9a5c)',
                    border: 'none',
                    borderRadius: 50,
                    height: 52,
                    padding: '0 32px',
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(255,107,53,0.35)',
                  }}
                >
                  🍔 Đặt đồ ăn ngay!
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate('/stores')}
                  style={{
                    borderRadius: 50, height: 52, padding: '0 28px',
                    fontSize: 15, borderColor: '#ff6b35', color: '#ff6b35',
                    fontWeight: 600,
                  }}
                >
                  Xem quán ăn gần bạn →
                </Button>
                {user?.role === 'user' && (
                  <Button
                    size="large"
                    onClick={() => navigate('/become-store')}
                    style={{
                      borderRadius: 50, height: 52, padding: '0 28px',
                      fontSize: 15, borderColor: '#1890ff', color: '#1890ff',
                      fontWeight: 600,
                    }}
                  >
                    Muốn bán hàng?
                  </Button>
                )}
              </Space>

              {/* trust badges */}
              <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
                {[
                  { icon: '⭐', text: '4.9/5 đánh giá' },
                  { icon: '🏪', text: '50+ quán đối tác' },
                  { icon: '🛵', text: 'Giao trong 30 phút' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18 }}>{b.icon}</span>
                    <Text style={{ color: '#555', fontSize: 13, fontWeight: 500 }}>{b.text}</Text>
                  </div>
                ))}
              </div>
            </Col>

            {/* Hero visual */}
            <Col xs={0} md={10} style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{
                  width: 320, height: 320, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffe4cc 0%, #ffd0a8 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 140, boxShadow: '0 20px 60px rgba(255,107,53,0.2)',
                }}>
                  🍜
                </div>
                {/* floating cards */}
                <div style={{
                  position: 'absolute', top: 20, left: -40,
                  background: '#fff', borderRadius: 12, padding: '10px 14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 20 }}>🛵</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#999' }}>Giao hàng</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6b35' }}>25 phút</div>
                  </div>
                </div>
                <div style={{
                  position: 'absolute', bottom: 40, right: -50,
                  background: '#fff', borderRadius: 12, padding: '10px 14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#999' }}>Đánh giá</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#faad14' }}>4.9 / 5.0</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* ══════════════ STATS BAR ══════════════ */}
      <div style={{ background: '#ff6b35', padding: '18px 24px' }}>
        <Row justify="center" gutter={[40, 0]} style={{ maxWidth: 1100, margin: '0 auto' }}>
          {[
            { value: '50+', label: 'Quán đối tác' },
            { value: '10K+', label: 'Đơn hàng/tháng' },
            { value: '25 phút', label: 'Thời gian giao TB' },
            { value: '4.9⭐', label: 'Điểm đánh giá' },
          ].map((s, i) => (
            <Col key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{s.label}</div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ══════════════ CATEGORIES ══════════════ */}
      <div style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ color: '#ff6b35', fontWeight: 600, fontSize: 14, letterSpacing: 1, marginBottom: 8 }}>
            DANH MỤC MÓN ĂN
          </div>
          <Title level={2} style={{ margin: 0 }}>
            Khám phá{' '}
            <span style={{ color: '#ff6b35' }}>món ngon</span>{' '}
            mọi thể loại
          </Title>
        </div>

        <Row gutter={[16, 16]} justify="center">
          {CATEGORIES.map((cat, i) => (
            <Col key={i} xs={8} sm={6} md={3}>
              <div
                onClick={() => navigate('/stores')}
                style={{
                  background: cat.color,
                  border: `2px solid ${cat.border}22`,
                  borderRadius: 16, padding: '18px 8px',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 12px 24px ${cat.border}33`;
                  e.currentTarget.style.borderColor = cat.border;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${cat.border}22`;
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{cat.icon}</div>
                <Text style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{cat.label}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <div style={{ background: '#fff8f4', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ color: '#ff6b35', fontWeight: 600, fontSize: 14, letterSpacing: 1, marginBottom: 8 }}>
              CÁCH HOẠT ĐỘNG
            </div>
            <Title level={2} style={{ margin: 0 }}>
              Chỉ{' '}
              <span style={{ color: '#ff6b35' }}>3 bước</span>{' '}
              là có đồ ăn 🎉
            </Title>
          </div>

          <Row gutter={[32, 32]}>
            {HOW_IT_WORKS.map((step, i) => (
              <Col xs={24} md={8} key={i}>
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  {/* connector line */}
                  {i < 2 && (
                    <div style={{
                      position: 'absolute', top: 48, left: '55%', width: '90%', height: 2,
                      background: 'linear-gradient(90deg, #ff6b35aa, transparent)',
                      display: window.innerWidth < 768 ? 'none' : 'block',
                    }} />
                  )}
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%', margin: '0 auto 20px',
                    background: `${step.color}18`,
                    border: `3px solid ${step.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 40, position: 'relative',
                  }}>
                    {step.icon}
                    <div style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 28, height: 28, borderRadius: '50%',
                      background: step.color, color: '#fff',
                      fontSize: 12, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {step.step}
                    </div>
                  </div>
                  <Title level={4} style={{ marginBottom: 8 }}>{step.title}</Title>
                  <Text type="secondary" style={{ lineHeight: 1.6, fontSize: 14 }}>{step.desc}</Text>
                </div>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={() => navigate('/stores')}
              style={{
                background: '#ff6b35', borderColor: '#ff6b35',
                borderRadius: 50, height: 52, padding: '0 40px',
                fontSize: 16, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
              }}
            >
              Bắt đầu đặt đồ ăn ngay
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════ FEATURES ══════════════ */}
      <div style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ color: '#ff6b35', fontWeight: 600, fontSize: 14, letterSpacing: 1, marginBottom: 8 }}>
            VÌ SAO CHỌN CHÚNG TÔI
          </div>
          <Title level={2} style={{ margin: 0 }}>
            Trải nghiệm{' '}
            <span style={{ color: '#ff6b35' }}>đặt hàng</span>{' '}
            hoàn hảo
          </Title>
        </div>

        <Row gutter={[24, 24]}>
          {FEATURES.map((f, i) => (
            <Col xs={24} sm={12} md={6} key={i}>
              <Card
                style={{
                  borderRadius: 20, border: '1.5px solid #f0f0f0',
                  textAlign: 'center', height: '100%',
                  transition: 'all 0.25s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}
                styles={{ body: { padding: '32px 20px' } }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(255,107,53,0.15)';
                  e.currentTarget.style.borderColor = '#ffcba8';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#fff5f0', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <Title level={5} style={{ marginBottom: 8 }}>{f.title}</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{f.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <div style={{ background: '#fff8f4', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ color: '#ff6b35', fontWeight: 600, fontSize: 14, letterSpacing: 1, marginBottom: 8 }}>
              KHÁCH HÀNG NÓI GÌ
            </div>
            <Title level={2} style={{ margin: 0 }}>
              Hàng nghìn khách hàng{' '}
              <span style={{ color: '#ff6b35' }}>tin tưởng</span>
            </Title>
          </div>

          <Row gutter={[24, 24]}>
            {TESTIMONIALS.map((t, i) => (
              <Col xs={24} md={8} key={i}>
                <Card
                  style={{
                    borderRadius: 20, border: '1.5px solid #ffe4cc',
                    boxShadow: '0 4px 16px rgba(255,107,53,0.08)',
                  }}
                  styles={{ body: { padding: '28px 24px' } }}
                >
                  {/* stars */}
                  <div style={{ marginBottom: 14 }}>
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <StarFilled key={si} style={{ color: '#faad14', fontSize: 16, marginRight: 2 }} />
                    ))}
                  </div>
                  <Paragraph style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 20 }}>
                    "{t.text}"
                  </Paragraph>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: '#fff3ee', border: '2px solid #ffcba8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>Khách hàng thân thiết</div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%)',
        padding: '64px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🍔</div>
          <Title level={2} style={{ color: '#fff', marginBottom: 12 }}>
            Đói rồi? Đặt ngay thôi!
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 32 }}>
            Hàng chục quán ăn ngon đang chờ bạn khám phá.<br />
            Giao hàng nhanh, tận nơi, giá cả hợp lý.
          </Paragraph>
          <Space size={12} wrap style={{ justifyContent: 'center' }}>
            <Button
              size="large"
              onClick={() => navigate('/stores')}
              style={{
                background: '#fff', color: '#ff6b35',
                border: 'none', borderRadius: 50,
                height: 52, padding: '0 36px',
                fontSize: 16, fontWeight: 800,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              🍴 Đặt đồ ăn ngay!
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/stores')}
              style={{
                background: 'transparent', color: '#fff',
                border: '2px solid rgba(255,255,255,0.7)',
                borderRadius: 50, height: 52, padding: '0 28px',
                fontSize: 15,
              }}
            >
              Xem quán ăn →
            </Button>
          </Space>
        </div>
      </div>

      {/* ══════════════ FOOTER ══════════════ */}
      <div style={{
        background: '#1a1a1a', color: '#aaa',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🍔 SmartFood</div>
        <Text style={{ color: '#666', fontSize: 13 }}>
          © 2026 SmartFood — Đặt đồ ăn thông minh tại TP. Thủ Đức, TP.HCM
        </Text>
      </div>
    </div>
  );
};

export default HomePage;
