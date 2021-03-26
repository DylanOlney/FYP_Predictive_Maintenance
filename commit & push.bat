@Echo off
For /f %%G in ('cscript /nologo getdate.vbs') do set _dtm=%%G
Set _yyyy=%_dtm:~0,4%
Set _mm=%_dtm:~4,2%
Set _dd=%_dtm:~6,2%
Set _hh=%_dtm:~8,2%
Set _nn=%_dtm:~10,2%
@Echo on

git add .
git commit -m "%_dd%/%_mm%/%_yyyy% @ %_hh%:%_nn%"
git push
git push gitlab
pause