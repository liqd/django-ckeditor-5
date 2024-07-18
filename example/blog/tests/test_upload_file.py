from django.test import override_settings
from django.urls import reverse


def test_upload_file(admin_client, file):
    with file as upload:
        response = admin_client.post(
            reverse("ck_editor_5_upload_file"),
            {"upload": upload},
        )
    assert response.status_code == 200
    assert "url" in response.json()


@override_settings(
    CKEDITOR_5_FILE_STORAGE="storages.backends.gcloud.GoogleCloudStorage",
    GS_BUCKET_NAME="test",
)
def test_upload_file_to_google_cloud(admin_client, file, settings):
    with file as upload:
        response = admin_client.post(
            reverse("ck_editor_5_upload_file"),
            {"upload": upload},
        )
    assert response.status_code == 200
    assert "url" in response.json()


def test_upload_file_too_big(admin_client, file_big):
    with file_big as upload:
        upload_view_name = getattr(settings, "CK_EDITOR_5_UPLOAD_FILE_VIEW_NAME", "")
        response = admin_client.post(
            reverse(upload_view_name),
            {"upload": upload},
        )
    assert response.status_code == 400
    response_data = response.json()
    assert "error" in response_data
    error = response_data["error"]
    assert "message" in error
    assert error["message"] == "File should be at most 0.06 MB."


def test_upload_file_forbbiden_file_typ(admin_client, file_dat):
    with file_dat as upload:
        upload_view_name = getattr(settings, "CK_EDITOR_5_UPLOAD_FILE_VIEW_NAME", "")
        response = admin_client.post(
            reverse(upload_view_name),
            {"upload": upload},
        )
    assert response.status_code == 400
    response_data = response.json()
    assert "error" in response_data
    error = response_data["error"]
    assert "message" in error
    assert error["message"] == (
        "File extension “dat” is not allowed. Allowed extensions are: jpg, jpeg, png, gif, "
        "bmp, webp, tiff."
    )
