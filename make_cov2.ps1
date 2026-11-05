Add-Type -AssemblyName System.Drawing
$W=256; $b=New-Object Drawing.Bitmap $W,$W
$g=[Drawing.Graphics]::FromImage($b); $g.InterpolationMode='NearestNeighbor'; $g.SmoothingMode='None'; $g.PixelOffsetMode='Half'
function C([int]$r,[int]$g,[int]$b){[Drawing.Color]::FromArgb($r,$g,$b)}
function Rec($x,$y,$w,$h,$c){$br=New-Object Drawing.SolidBrush $c; $script:g.FillRectangle($br,$x,$y,$w,$h);$br.Dispose()}
function L($x1,$y1,$x2,$y2,$c,$z=1){$p=New-Object Drawing.Pen $c,$z;$script:g.DrawLine($p,$x1,$y1,$x2,$y2);$p.Dispose()}
$rand=New-Object Random 2004
for($y=0;$y -lt 256;$y++){ if($y -lt 126){$t=$y/126;$c=C (16-7*$t) (34-15*$t) (49-17*$t)}else{$t=($y-126)/130;$c=C (15-6*$t) (24-10*$t) (31-12*$t)};Rec 0 $y 256 1 $c }
foreach($a in @(@(-16,68,39),@(43,70,27),@(111,63,43),@(169,78,22),@(238,46,47))){$x=$a[0];$bw=$a[1];$top=$a[2];Rec $x $top $bw 104 (C 31 42 52);Rec ($x+3) ($top+3) ($bw-6) 5 (C 48 57 65);for($yy=$top+14;$yy -lt 135;$yy+=12){for($xx=$x+7;$xx -lt $x+$bw-5;$xx+=13){if($rand.NextDouble() -lt .62){$lit=$rand.NextDouble() -lt .24;Rec $xx $yy 7 6 $(if($lit){C 125 76 39}else{C 17 27 35});if($lit){Rec ($xx+2) ($yy+2) 1 1 (C 232 150 68)}}}}}
Rec 0 137 256 119 (C 18 27 33);foreach($y in @(150,165,185,211,242)){L 0 $y 256 $y (C 27 37 42)};for($x=-80;$x -lt 340;$x+=35){L 128 137 $x 256 (C 25 35 40)}
Rec 173 80 65 71 (C 23 29 33);Rec 176 83 59 4 (C 47 52 54);Rec 179 112 53 38 (C 4 8 12)
foreach($a in @(@(187,121),@(202,116),@(216,123),@(226,119))){$x=$a[0];$y=$a[1];$br=New-Object Drawing.SolidBrush (C 8 11 14);$g.FillEllipse($br,$x-4,$y-8,8,8);$g.FillPolygon($br,@([Drawing.Point]::new($x-6,$y),[Drawing.Point]::new($x+6,$y),[Drawing.Point]::new($x+8,143),[Drawing.Point]::new($x-7,143)));$br.Dispose();Rec ($x+3) ($y-1) 2 2 (C 255 76 33);Rec ($x+5) ($y-1) 1 1 (C 255 201 78)}
foreach($x in @(8,72)){Rec $x 107 33 41 (C 47 53 53);Rec ($x+3) 112 27 17 (C 28 45 48);L ($x+4) 133 ($x+29) 133 (C 122 63 35) 2;for($i=0;$i -lt 8;$i++){Rec ($rand.Next($x+2,$x+31)) ($rand.Next(108,147)) 1 1 (C 136 68 37)}}
foreach($x in @(31,151)){L $x 77 $x 146 (C 34 38 39) 3;$br=New-Object Drawing.SolidBrush (C 151 86 36);$g.FillEllipse($br,$x-8,89,16,17);$br.Dispose();$br=New-Object Drawing.SolidBrush (C 245 151 60);$g.FillEllipse($br,$x-5,92,10,11);$br.Dispose();$br=New-Object Drawing.SolidBrush (C 54 42 31);$g.FillEllipse($br,$x-28,170,57,15);$br.Dispose();$br=New-Object Drawing.SolidBrush (C 114 65 34);$g.FillEllipse($br,$x-17,173,35,8);$br.Dispose()}
foreach($a in @(@(4,206,77,18),@(144,217,107,24),@(79,239,69,13))){$br=New-Object Drawing.SolidBrush (C 16 40 49);$g.FillEllipse($br,$a[0],$a[1],$a[2],$a[3]);$br.Dispose();for($i=0;$i -lt 8;$i++){L ($rand.Next($a[0]+4,$a[0]+$a[2]-3)) ($rand.Next($a[1]+2,$a[1]+$a[3]-2)) ($rand.Next($a[0]+4,$a[0]+$a[2]-3)) ($rand.Next($a[1]+2,$a[1]+$a[3]-2)) (C 91 74 47)}}
for($i=0;$i -lt 125;$i++){$x=$rand.Next(256);$y=$rand.Next(25,256);L $x $y ($x-1) ($y+$rand.Next(2,5)) (C 54 82 91)}
$s=New-Object Drawing.Bitmap 'art_src/l7/pick_valera.jpg';$crop=New-Object Drawing.Bitmap 140,240; $cg=[Drawing.Graphics]::FromImage($crop);$cg.DrawImage($s,(New-Object Drawing.Rectangle 0,0,140,240),(New-Object Drawing.Rectangle 480,500,140,240),[Drawing.GraphicsUnit]::Pixel);$cg.Dispose();$s.Dispose()
for($y=0;$y -lt 240;$y++){for($x=0;$x -lt 140;$x++){$p=$crop.GetPixel($x,$y);if($p.G -gt 55 -and $p.G -gt $p.R -and $p.G -gt $p.B){$crop.SetPixel($x,$y,[Drawing.Color]::Transparent)}}}
$hero=New-Object Drawing.Bitmap 105,145;$hg=[Drawing.Graphics]::FromImage($hero);$hg.InterpolationMode='NearestNeighbor';$hg.DrawImage($crop,0,0,105,145);$hg.Dispose();$crop.Dispose();$g.DrawImage($hero,75,96,105,145);$hero.Dispose()
for($i=0;$i -lt 32;$i++){$x=$rand.Next(72,185);$y=$rand.Next(96,246);L $x $y ($x-1) ($y+3) (C 100 125 130)}
$out=New-Object Drawing.Bitmap 1024,1024;$og=[Drawing.Graphics]::FromImage($out);$og.InterpolationMode='NearestNeighbor';$og.PixelOffsetMode='Half';$og.DrawImage($b,0,0,1024,1024);$og.Dispose();$b.Dispose();New-Item -ItemType Directory -Force 'art_src/covers'|Out-Null;$out.Save((Resolve-Path 'art_src/covers').Path+'\\cov2.png',[Drawing.Imaging.ImageFormat]::Png);$out.Dispose();$g.Dispose()
