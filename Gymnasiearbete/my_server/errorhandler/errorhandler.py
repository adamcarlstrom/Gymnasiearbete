from flask import Blueprint, render_template,session

error_bp =  Blueprint('error_bp', __name__, template_folder='templates', static_folder='static')

@error_bp.app_errorhandler(404)
def not_found_error(error):
    if 'logged_in' not in session or session['logged_in'] == False:
        session['logged_in'] = False
        session.pop('user', None)
    print('###########################')
    print('Error 404')
    session['page'] = '404'
    return render_template('/errors/404.html', active_page = '404'), 404


@error_bp.app_errorhandler(401)
def not_authorized_error(error):
    session['logged_in'] = False
    session.pop('user', None)
    print('###########################')
    print('Error 401')
    session['page'] = '401'
    return render_template('/errors/401.html', active_page = '401'), 401