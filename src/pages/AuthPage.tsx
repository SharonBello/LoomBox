import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TextField, Alert, Divider, CircularProgress } from '@mui/material'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/services/authService'
import { useAppStore } from '@/store/appStore'
import type { Language } from '@/types'
import styles from './AuthPage.module.scss'

const AuthPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setUser, language, setLanguage } = useAppStore()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const signInSchema = z.object({
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(6, t('auth.validation.passwordMin')),
  })
  const signUpSchema = z.object({
    name: z.string().min(2, t('auth.validation.nameMin')),
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(6, t('auth.validation.passwordMin')),
    confirm: z.string(),
  }).refine(d => d.password === d.confirm, {
    message: t('auth.validation.passwordMatch'),
    path: ['confirm'],
  })

  type SignInForm = z.infer<typeof signInSchema>
  type SignUpForm = z.infer<typeof signUpSchema>

  const signInForm = useForm<SignInForm>({ resolver: zodResolver(signInSchema) })
  const signUpForm = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) })

  const handleSignIn = async (data: SignInForm) => {
    setError(''); setLoading(true)
    try {
      const user = await signInWithEmail(data.email, data.password)
      setUser(user); navigate('/dashboard', { replace: true })
    } catch (e) { setError(getFirebaseError(e, t)) }
    finally { setLoading(false) }
  }

  const handleSignUp = async (data: SignUpForm) => {
    setError(''); setLoading(true)
    try {
      const user = await signUpWithEmail(data.email, data.password, data.name)
      setUser(user); navigate('/dashboard', { replace: true })
    } catch (e) { setError(getFirebaseError(e, t)) }
    finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setError(''); setGLoading(true)
    try {
      const user = await signInWithGoogle()
      setUser(user); navigate('/dashboard', { replace: true })
    } catch (e) { setError(getFirebaseError(e, t)) }
    finally { setGLoading(false) }
  }

  const handleLangToggle = () => {
    const next: Language = language === 'en' ? 'he' : 'en'
    i18n.changeLanguage(next)
    setLanguage(next)
  }

  return (
    <div className={styles.page}>

      {/* Left decorative panel — always LTR regardless of app language */}
      <aside className={styles.panel} dir="ltr">
        <div className={styles.panelInner}>
          <Link to="/" className={styles.panelBrand}>
            <span className={styles.brandStar}>✦</span>
            <span className={styles.brandName}>{t('brand.name')}</span>
          </Link>

          {/*
            Quote is always English decorative text on a dark panel.
            dir="ltr" on the aside already handles this, but we add
            style as a belt-and-braces fix for RTL browser rendering.
          */}
          <div className={styles.panelQuote} style={{ direction: 'ltr', textAlign: 'left' }}>
            <p>
              &ldquo;Every family has a story.
              <br />
              Yours deserves to be beautifully told.&rdquo;
            </p>
          </div>

          <ul className={styles.featureList}>
            {(['ai', 'tree', 'photos', 'book'] as const).map(k => (
              <li key={k} className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  {k === 'ai' ? '✍️' : k === 'tree' ? '🌳' : k === 'photos' ? '📸' : '📖'}
                </span>
                <span>{t(`auth.features.${k}`)}</span>
              </li>
            ))}
          </ul>

          <div className={styles.dotGrid} aria-hidden="true">
            {Array.from({ length: 42 }).map((_, i) => (
              <span key={i} className={styles.dot} />
            ))}
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className={styles.formPanel}>
        <div className={styles.formWrap}>

          {/* Mobile top: brand + lang switcher */}
          <div className={styles.mobileTop}>
            <Link to="/" className={styles.mobileBrand}>
              <span className={styles.brandStar}>✦</span>
              <span className={styles.brandName}>{t('brand.name')}</span>
            </Link>
            <button className={styles.langBtn} onClick={handleLangToggle}>
              <span>{language === 'en' ? '🇮🇱' : '🇬🇧'}</span>
              <span className={styles.langLabel}>{language === 'en' ? 'עב' : 'EN'}</span>
            </button>
          </div>

          <div className={styles.heading}>
            <h1 className={styles.title}>
              {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createYourAccount')}
            </h1>
            <p className={styles.subtitle}>{t('auth.joinLoombox')}</p>
          </div>

          {/* Mode tabs */}
          <div className={styles.tabs}>
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                className={`${styles.tab} ${mode === m ? styles.tabActive : ''}`}
                onClick={() => { setMode(m); setError('') }}
              >
                {m === 'signin' ? t('auth.signIn') : t('auth.signUp')}
              </button>
            ))}
          </div>

          {error && (
            <Alert severity="error" sx={{ borderRadius: '10px', mb: 2, fontSize: '0.8125rem' }}>
              {error}
            </Alert>
          )}

          {/* Google OAuth */}
          <button className={styles.googleBtn} onClick={handleGoogle} disabled={gLoading || loading}>
            {gLoading ? <CircularProgress size={16} color="inherit" /> : <GoogleIcon />}
            <span>{t('auth.continueGoogle')}</span>
          </button>

          <Divider sx={{ my: 2.5 }}>
            <span className={styles.dividerLabel}>{t('auth.orDivider')}</span>
          </Divider>

          {/* Sign In form */}
          {mode === 'signin' && (
            <form className={styles.form} onSubmit={signInForm.handleSubmit(handleSignIn)} noValidate>
              <TextField
                label={t('auth.email')} type="email" fullWidth autoComplete="email"
                {...signInForm.register('email')}
                error={!!signInForm.formState.errors.email}
                helperText={signInForm.formState.errors.email?.message}
              />
              <TextField
                label={t('auth.password')} type="password" fullWidth autoComplete="current-password"
                {...signInForm.register('password')}
                error={!!signInForm.formState.errors.password}
                helperText={signInForm.formState.errors.password?.message}
              />
              <div className={styles.forgotRow}>
                <button type="button" className={styles.forgotBtn}>
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading
                  ? <><CircularProgress size={16} color="inherit" /> {t('auth.signingIn')}</>
                  : t('auth.signIn')}
              </button>
            </form>
          )}

          {/* Sign Up form */}
          {mode === 'signup' && (
            <form className={styles.form} onSubmit={signUpForm.handleSubmit(handleSignUp)} noValidate>
              <TextField
                label={t('auth.yourName')} type="text" fullWidth autoComplete="name"
                {...signUpForm.register('name')}
                error={!!signUpForm.formState.errors.name}
                helperText={signUpForm.formState.errors.name?.message}
              />
              <TextField
                label={t('auth.email')} type="email" fullWidth autoComplete="email"
                {...signUpForm.register('email')}
                error={!!signUpForm.formState.errors.email}
                helperText={signUpForm.formState.errors.email?.message}
              />
              <TextField
                label={t('auth.password')} type="password" fullWidth autoComplete="new-password"
                {...signUpForm.register('password')}
                error={!!signUpForm.formState.errors.password}
                helperText={signUpForm.formState.errors.password?.message}
              />
              <TextField
                label={t('auth.confirmPassword')} type="password" fullWidth
                {...signUpForm.register('confirm')}
                error={!!signUpForm.formState.errors.confirm}
                helperText={signUpForm.formState.errors.confirm?.message}
              />
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading
                  ? <><CircularProgress size={16} color="inherit" /> {t('auth.creatingAccount')}</>
                  : t('auth.signUp')}
              </button>
            </form>
          )}

          <p className={styles.toggleText}>
            {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
            <button
              className={styles.toggleBtn}
              onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
            >
              {mode === 'signin' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087C16.6582 14.019 17.64 11.7118 17.64 9.2045z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.806.54-1.8368.859-3.0477.859-2.3441 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853" />
    <path d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2822-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05" />
    <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335" />
  </svg>
)

const getFirebaseError = (error: unknown, t: (key: string) => string): string => {
  const code = (error as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/user-not-found': t('auth.errors.userNotFound'),
    'auth/wrong-password': t('auth.errors.wrongPassword'),
    'auth/email-already-in-use': t('auth.errors.emailInUse'),
    'auth/weak-password': t('auth.errors.weakPassword'),
    'auth/invalid-email': t('auth.errors.invalidEmail'),
    'auth/popup-closed-by-user': t('auth.errors.popupClosed'),
    'auth/network-request-failed': t('auth.errors.network'),
    'auth/too-many-requests': t('auth.errors.tooManyRequests'),
    'auth/invalid-credential': t('auth.errors.invalidCred'),
  }
  return map[code] ?? t('auth.errors.default')
}

export default AuthPage