.PHONY: docker-build
docker-build:
	docker build -t report_service:0.1 . --ssh default=../sshkeys
