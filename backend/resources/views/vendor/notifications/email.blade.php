@php
    $appName = config('app.name', 'Secondhand Heart');
    $accent = '#7c3aed'; // matches frontend --sh-accent
    $bg0 = '#ffffff';
    $bg1 = '#faf7ff';
    $text = '#0f172a';
    $muted = '#64748b';
    $border = 'rgba(15, 23, 42, 0.08)';

    $title = trim((string) ($subject ?? ''));
@endphp
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background-color:{{ $bg0 }};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:
        radial-gradient(1000px 600px at 10% -10%, rgba(124, 58, 237, 0.16), transparent 55%),
        radial-gradient(900px 500px at 90% 0%, rgba(168, 85, 247, 0.10), transparent 55%),
        linear-gradient(180deg, {{ $bg1 }}, {{ $bg0 }});">
        <tr>
            <td align="center" style="padding:32px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:640px;">
                    <tr>
                        <td style="padding:0 0 16px 0;">
                            <div style="font-family:Arial,Helvetica,sans-serif;color:{{ $text }};font-size:18px;font-weight:700;">
                                {{ $appName }}
                            </div>
                            @if($title !== '')
                                <div style="font-family:Arial,Helvetica,sans-serif;color:{{ $muted }};font-size:13px;margin-top:4px;">
                                    {{ $title }}
                                </div>
                            @endif
                        </td>
                    </tr>

                    <tr>
                        <td style="background:rgba(255,255,255,0.78);border:1px solid {{ $border }};border-radius:14px;padding:20px;">
                            <div style="font-family:Arial,Helvetica,sans-serif;color:{{ $text }};font-size:14px;line-height:1.5;">
                                {{-- Intro Lines --}}
                                @foreach ($introLines as $line)
                                    @php
                                        $trimmed = trim((string) $line);
                                    @endphp
                                    @if (preg_match('/^[0-9]{6}$/', $trimmed))
                                        <div style="margin:12px 0 16px 0;">
                                            <span style="display:inline-block;padding:10px 14px;border-radius:999px;background:rgba(124,58,237,0.10);border:1px solid rgba(124,58,237,0.18);color:rgba(124,58,237,0.92);font-weight:800;font-size:18px;letter-spacing:0.12em;">
                                                {{ $trimmed }}
                                            </span>
                                        </div>
                                    @else
                                        <p style="margin:0 0 12px 0;">{{ $line }}</p>
                                    @endif
                                @endforeach

                                {{-- Action Button --}}
                                @isset($actionText)
                                    @php
                                        $actionUrl = $actionUrl ?? '#';
                                        $actionTextLocal = $actionText;
                                    @endphp
                                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 16px 0;">
                                        <tr>
                                            <td>
                                                <a href="{{ $actionUrl }}"
                                                   style="display:inline-block;background:{{ $accent }};color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">
                                                    {{ $actionTextLocal }}
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                @endisset

                                {{-- Outro Lines --}}
                                @foreach ($outroLines as $line)
                                    <p style="margin:0 0 12px 0;color:{{ $muted }};">{{ $line }}</p>
                                @endforeach

                                {{-- Subcopy --}}
                                @isset($actionText)
                                    <hr style="border:none;border-top:1px solid {{ $border }};margin:16px 0;">
                                    <p style="margin:0;color:{{ $muted }};font-size:12px;">
                                        If the button doesn't work, copy and paste this link into your browser:
                                        <br>
                                        <span style="word-break:break-all;">{{ $actionUrl }}</span>
                                    </p>
                                @endisset
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:14px 0 0 0;">
                            <div style="font-family:Arial,Helvetica,sans-serif;color:{{ $muted }};font-size:12px;line-height:1.5;">
                                © {{ date('Y') }} {{ $appName }}. All rights reserved.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

